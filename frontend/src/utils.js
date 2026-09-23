import { Platform, Alert } from 'react-native';

export function notify(title, msg) {
  if (Platform.OS === 'web') {
    window.alert(msg ? `${title}\n\n${msg}` : title);
  } else {
    Alert.alert(title, msg);
  }
}

export function confirmAction(title, msg, onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${msg}`)) onConfirm();
  } else {
    Alert.alert(title, msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

export function getLocation() {
  return new Promise((resolve) => {
    const fallback = { lat: -3.1190, lng: -60.0217 };
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(fallback),
        { enableHighAccuracy: false, timeout: 8000 }
      );
    } else {
      resolve(fallback);
    }
  });
}

export function openURL(url) {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    // eslint-disable-next-line global-require
    require('react-native').Linking.openURL(url);
  }
}

export function todayLabel() {
  return new Date()
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase();
}

export function mapsLink(gps, endereco) {
  if (gps?.lat && gps?.lng) return `https://www.google.com/maps/search/?api=1&query=${gps.lat},${gps.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco || '')}`;
}
