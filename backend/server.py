import os
from dotenv import load_dotenv

load_dotenv()

import re
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("poliprint")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="PoliPrint API")
api = APIRouter(prefix="/api")

ROLES = ["cliente", "tecnico", "estoque", "god"]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return uuid.uuid4().hex


# ==========================================
# WHATSAPP (Twilio automatic + wa.me links)
# ==========================================
def only_digits(phone: str) -> str:
    return re.sub(r"\D", "", phone or "")


def normalize_br(phone: str) -> str:
    d = only_digits(phone)
    if not d:
        return ""
    if not d.startswith("55"):
        d = "55" + d
    return d


def build_wa_link(phone: str, message: str) -> str:
    from urllib.parse import quote
    d = normalize_br(phone)
    return f"https://wa.me/{d}?text={quote(message)}"


def twilio_configured() -> bool:
    return bool(
        os.environ.get("TWILIO_ACCOUNT_SID")
        and os.environ.get("TWILIO_AUTH_TOKEN")
        and os.environ.get("TWILIO_WHATSAPP_FROM")
    )


async def send_whatsapp(to_phone: str, body: str) -> dict:
    """Best-effort automatic WhatsApp send via Twilio. Never raises."""
    to = normalize_br(to_phone)
    if not to:
        return {"sent": False, "reason": "sem_numero"}
    if not twilio_configured():
        logger.info(f"[WA-SIMULADO] Para +{to}: {body}")
        return {"sent": False, "reason": "twilio_nao_configurado", "simulated": True}
    try:
        from twilio.rest import Client
        c = Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])
        msg = c.messages.create(
            from_=f"whatsapp:{os.environ['TWILIO_WHATSAPP_FROM']}",
            to=f"whatsapp:+{to}",
            body=body,
        )
        return {"sent": True, "sid": msg.sid}
    except Exception as e:
        logger.error(f"Erro Twilio: {e}")
        return {"sent": False, "reason": str(e)}


async def notify_roles(roles: List[str], body: str):
    cursor = db.users.find({"role": {"$in": roles}, "whatsapp": {"$ne": ""}}, {"whatsapp": 1, "_id": 0})
    async for u in cursor:
        await send_whatsapp(u.get("whatsapp", ""), body)


# ==========================================
# MODELS
# ==========================================
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=4)
    role: str = "cliente"
    whatsapp: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ChamadoIn(BaseModel):
    setor: str
    endereco: str
    impressora: str
    numSerie: str = ""
    erro: str
    whatsapp: str
    foto: Optional[str] = None
    localizacaoGPS: Optional[dict] = None


class ChamadoUpdate(BaseModel):
    status: Optional[str] = None
    tecnicoAtribuido: Optional[str] = None
    tecnicoFinalizador: Optional[str] = None
    dataFinalizacao: Optional[str] = None


class PedidoIn(BaseModel):
    setor: str
    itens: List[dict]


class PedidoUpdate(BaseModel):
    status: str


class CategoriaIn(BaseModel):
    icone: str = "📦"
    nome: str


class ModeloIn(BaseModel):
    nome: str
    estoque: int = 0


class EstoqueDelta(BaseModel):
    delta: int


class PontoIn(BaseModel):
    tipo: str
    horario: str
    data: str
    coords: str = ""
    foto: Optional[str] = None


class WhatsLinkIn(BaseModel):
    phone: str
    message: str


# ==========================================
# AUTH DEPENDENCY
# ==========================================
async def current_user(request: Request):
    return await get_current_user(request, db)


def public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "name": u["name"],
        "email": u["email"],
        "role": u["role"],
        "whatsapp": u.get("whatsapp", ""),
    }


# ==========================================
# AUTH ROUTES
# ==========================================
@api.post("/auth/register")
async def register(body: RegisterIn):
    email = body.email.lower().strip()
    role = body.role if body.role in ROLES else "cliente"
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    user = {
        "id": new_id(),
        "name": body.name.strip(),
        "email": email,
        "password_hash": hash_password(body.password),
        "role": role,
        "whatsapp": only_digits(body.whatsapp),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_access_token(user["id"], email, role)
    return {"token": token, "user": public_user(user)}


@api.post("/auth/login")
async def login(body: LoginIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    token = create_access_token(user["id"], email, user["role"])
    return {"token": token, "user": public_user(user)}


@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return {"user": public_user(user)}


# ==========================================
# CHAMADOS
# ==========================================
@api.get("/chamados")
async def list_chamados(user: dict = Depends(current_user)):
    q = {}
    if user["role"] == "cliente":
        q = {"criadoPor": user["id"]}
    docs = await db.chamados.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api.post("/chamados")
async def create_chamado(body: ChamadoIn, user: dict = Depends(current_user)):
    numero = int(datetime.now().timestamp()) % 100000
    doc = {
        "id": new_id(),
        "numero": numero,
        **body.model_dump(),
        "whatsapp": only_digits(body.whatsapp),
        "localizacaoGPS": body.localizacaoGPS or {"lat": -3.1190, "lng": -60.0217},
        "status": "Pendente",
        "tecnicoAtribuido": None,
        "tecnicoFinalizador": None,
        "dataFinalizacao": None,
        "criadoPor": user["id"],
        "criadoPorNome": user["name"],
        "created_at": now_iso(),
    }
    await db.chamados.insert_one(doc)
    doc.pop("_id", None)
    # WhatsApp: confirma pro cliente + alerta equipe
    cliente_msg = (
        f"Olá {body.setor}! Seu chamado #{numero} para o equipamento "
        f"{body.impressora} foi aberto com sucesso na PoliPrint. "
        f"Nosso técnico entrará em contato em breve. 🔧"
    )
    equipe_msg = (
        f"🚨 NOVO CHAMADO #{numero}\nCliente: {body.setor}\n"
        f"Equipamento: {body.impressora}\nDefeito: {body.erro}\n"
        f"Local: {body.endereco}"
    )
    wa = await send_whatsapp(body.whatsapp, cliente_msg)
    await notify_roles(["tecnico", "god"], equipe_msg)
    return {"chamado": doc, "whatsapp": wa, "wa_link": build_wa_link(body.whatsapp, cliente_msg)}


@api.patch("/chamados/{chamado_id}")
async def update_chamado(chamado_id: str, body: ChamadoUpdate, user: dict = Depends(current_user)):
    ch = await db.chamados.find_one({"id": chamado_id}, {"_id": 0})
    if not ch:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    await db.chamados.update_one({"id": chamado_id}, {"$set": updates})
    ch.update(updates)
    if body.status == "Em Andamento":
        await send_whatsapp(
            ch.get("whatsapp", ""),
            f"👨‍🔧 Técnico {body.tecnicoAtribuido or user['name']} a caminho! "
            f"Chamado #{ch['numero']}. Acompanhe pelo PoliPrint.",
        )
    if body.status == "Finalizado":
        await send_whatsapp(
            ch.get("whatsapp", ""),
            f"✅ Chamado #{ch['numero']} finalizado por "
            f"{body.tecnicoFinalizador or user['name']}. Obrigado por escolher a PoliPrint!",
        )
    return ch


# ==========================================
# PEDIDOS
# ==========================================
@api.get("/pedidos")
async def list_pedidos(user: dict = Depends(current_user)):
    q = {}
    if user["role"] == "cliente":
        q = {"criadoPor": user["id"]}
    docs = await db.pedidos.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api.post("/pedidos")
async def create_pedido(body: PedidoIn, user: dict = Depends(current_user)):
    numero = int(datetime.now().timestamp()) % 100000
    doc = {
        "id": new_id(),
        "numero": numero,
        "setor": body.setor,
        "itens": body.itens,
        "status": "Pendente",
        "criadoPor": user["id"],
        "created_at": now_iso(),
    }
    await db.pedidos.insert_one(doc)
    doc.pop("_id", None)
    resumo = ", ".join(f"{i.get('qtd')}x {i.get('nome')} ({i.get('modelo')})" for i in body.itens)
    await notify_roles(
        ["estoque", "god"],
        f"📦 NOVO PEDIDO #{numero}\nSetor: {body.setor}\nItens: {resumo}",
    )
    return {"pedido": doc}


@api.patch("/pedidos/{pedido_id}")
async def update_pedido(pedido_id: str, body: PedidoUpdate, user: dict = Depends(current_user)):
    ped = await db.pedidos.find_one({"id": pedido_id}, {"_id": 0})
    if not ped:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    await db.pedidos.update_one({"id": pedido_id}, {"$set": {"status": body.status}})
    ped["status"] = body.status
    return ped


# ==========================================
# CATÁLOGO / ESTOQUE
# ==========================================
@api.get("/catalogo")
async def get_catalogo(user: dict = Depends(current_user)):
    docs = await db.catalogo.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return docs


@api.post("/catalogo")
async def add_categoria(body: CategoriaIn, user: dict = Depends(current_user)):
    doc = {"id": new_id(), "icone": body.icone or "📦", "nome": body.nome, "modelos": [], "created_at": now_iso()}
    await db.catalogo.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.delete("/catalogo/{cat_id}")
async def del_categoria(cat_id: str, user: dict = Depends(current_user)):
    await db.catalogo.delete_one({"id": cat_id})
    return {"ok": True}


@api.post("/catalogo/{cat_id}/modelos")
async def add_modelo(cat_id: str, body: ModeloIn, user: dict = Depends(current_user)):
    modelo = {"id": new_id(), "nome": body.nome, "estoque": body.estoque}
    await db.catalogo.update_one({"id": cat_id}, {"$push": {"modelos": modelo}})
    return modelo


@api.delete("/catalogo/{cat_id}/modelos/{mod_id}")
async def del_modelo(cat_id: str, mod_id: str, user: dict = Depends(current_user)):
    await db.catalogo.update_one({"id": cat_id}, {"$pull": {"modelos": {"id": mod_id}}})
    return {"ok": True}


@api.patch("/catalogo/{cat_id}/modelos/{mod_id}")
async def update_estoque(cat_id: str, mod_id: str, body: EstoqueDelta, user: dict = Depends(current_user)):
    cat = await db.catalogo.find_one({"id": cat_id}, {"_id": 0})
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    modelos = cat["modelos"]
    for m in modelos:
        if m["id"] == mod_id:
            m["estoque"] = max(0, m["estoque"] + body.delta)
    await db.catalogo.update_one({"id": cat_id}, {"$set": {"modelos": modelos}})
    return {"modelos": modelos}


@api.post("/catalogo/baixa")
async def baixa_estoque(body: dict, user: dict = Depends(current_user)):
    """body: {items:[{catId, modId, qtd}]}"""
    for it in body.get("items", []):
        cat = await db.catalogo.find_one({"id": it["catId"]}, {"_id": 0})
        if not cat:
            continue
        modelos = cat["modelos"]
        for m in modelos:
            if m["id"] == it["modId"]:
                m["estoque"] = max(0, m["estoque"] - int(it["qtd"]))
        await db.catalogo.update_one({"id": it["catId"]}, {"$set": {"modelos": modelos}})
    return {"ok": True}


# ==========================================
# PONTO ELETRÔNICO
# ==========================================
@api.get("/pontos")
async def list_pontos(mine: bool = False, user: dict = Depends(current_user)):
    q = {}
    if mine or user["role"] not in ("god",):
        q = {"tecnico": user["name"]}
    if user["role"] == "god" and not mine:
        q = {}
    docs = await db.pontos.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


@api.post("/pontos")
async def create_ponto(body: PontoIn, user: dict = Depends(current_user)):
    doc = {
        "id": new_id(),
        "tecnico": user["name"],
        **body.model_dump(),
        "created_at": now_iso(),
    }
    await db.pontos.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ==========================================
# WHATSAPP UTIL
# ==========================================
@api.post("/whatsapp/link")
async def whatsapp_link(body: WhatsLinkIn, user: dict = Depends(current_user)):
    return {"link": build_wa_link(body.phone, body.message)}


@api.post("/whatsapp/send")
async def whatsapp_send(body: WhatsLinkIn, user: dict = Depends(current_user)):
    res = await send_whatsapp(body.phone, body.message)
    return {"result": res, "link": build_wa_link(body.phone, body.message)}


@api.get("/whatsapp/status")
async def whatsapp_status(user: dict = Depends(current_user)):
    return {"twilio_configured": twilio_configured()}


# ==========================================
# DASHBOARD
# ==========================================
@api.get("/stats")
async def stats(user: dict = Depends(current_user)):
    chamados = await db.chamados.find({}, {"_id": 0, "status": 1}).to_list(5000)
    pedidos = await db.pedidos.find({}, {"_id": 0, "status": 1}).to_list(5000)
    return {
        "chamados_total": len(chamados),
        "chamados_pendentes": sum(1 for c in chamados if c["status"] == "Pendente"),
        "chamados_andamento": sum(1 for c in chamados if c["status"] == "Em Andamento"),
        "chamados_finalizados": sum(1 for c in chamados if c["status"] == "Finalizado"),
        "pedidos_total": len(pedidos),
        "pedidos_pendentes": sum(1 for p in pedidos if p["status"] != "Entregue"),
        "pedidos_entregues": sum(1 for p in pedidos if p["status"] == "Entregue"),
    }


@api.get("/")
async def root():
    return {"app": "PoliPrint API", "status": "online"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


DEFAULT_CATALOGO = [
    {"icone": "🔲", "nome": "Toner / Cartucho", "modelos": [
        {"nome": "Brother TN-1060", "estoque": 15}, {"nome": "HP 85A", "estoque": 3}]},
    {"icone": "📄", "nome": "Caixas de Papel", "modelos": [{"nome": "Chamex A4 75g", "estoque": 50}]},
    {"icone": "♨️", "nome": "Fusor", "modelos": [{"nome": "Fusor Brother (110V)", "estoque": 8}]},
    {"icone": "🖇️", "nome": "Cilindro / Drum", "modelos": [{"nome": "Drum Brother DR-1060", "estoque": 6}]},
]


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    # seed god
    admin_email = os.environ.get("ADMIN_EMAIL", "god@poliprint.com").lower()
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": new_id(),
            "name": os.environ.get("ADMIN_NAME", "Diretoria GOD"),
            "email": admin_email,
            "password_hash": hash_password(os.environ.get("ADMIN_PASSWORD", "poliprint777")),
            "role": "god",
            "whatsapp": only_digits(os.environ.get("ADMIN_WHATSAPP", "")),
            "created_at": now_iso(),
        })
        logger.info("GOD user seeded")
    # seed catalogo
    if await db.catalogo.count_documents({}) == 0:
        for c in DEFAULT_CATALOGO:
            await db.catalogo.insert_one({
                "id": new_id(), "icone": c["icone"], "nome": c["nome"],
                "modelos": [{"id": new_id(), **m} for m in c["modelos"]],
                "created_at": now_iso(),
            })
        logger.info("Catalogo seeded")
