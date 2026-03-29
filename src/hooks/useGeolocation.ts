import { useState, useCallback } from "react";

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
  });

  const requestPosition = useCallback((): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setState((s) => ({ ...s, error: "Geolocalização não suportada pelo navegador.", loading: false }));
        resolve(null);
        return;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setState({ latitude, longitude, accuracy, loading: false, error: null });
          resolve({ latitude, longitude });
        },
        (err) => {
          let message = "Erro ao obter localização.";
          if (err.code === err.PERMISSION_DENIED) {
            message = "Permissão de localização negada. Ative nas configurações do navegador.";
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            message = "Localização indisponível no momento.";
          } else if (err.code === err.TIMEOUT) {
            message = "Tempo esgotado ao obter localização.";
          }
          setState((s) => ({ ...s, loading: false, error: message }));
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    });
  }, []);

  return { ...state, requestPosition };
}
