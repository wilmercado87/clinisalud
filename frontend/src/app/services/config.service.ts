import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ClientConfig {
  clientName: string;
  clientLogo: string | null;
  welcomeMessage: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  public config = signal<ClientConfig>({
    clientName: 'Clinisalud',
    clientLogo: null,
    welcomeMessage: 'Acceso al Sistema Médico',
  });

  constructor(private http: HttpClient) {
    this.loadConfig();
  }

  loadConfig() {
    this.http.get<ClientConfig>('assets/config/client-config.json').subscribe({
      next: (data) => this.config.set(data),
      error: () => console.log('Usando configuración por defecto'),
    });
  }
}
