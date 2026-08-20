import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

export interface ClientConfig {
  clientName: string;
  clientLogo: string | null;
  welcomeMessage: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigStore {
  private readonly http = inject(HttpClient);

  private readonly defaultValues: ClientConfig = {
    clientName: 'Clinisalud',
    clientLogo: null,
    welcomeMessage: 'Acceso al Sistema Médico',
  };

  private readonly configResource = rxResource({
    loader: () => this.http.get<ClientConfig>('assets/config/client-config.json'),
  });

  public readonly config = computed<ClientConfig>(() => this.filterInvalidConfig(this.configResource.value()));

  constructor() {
    effect(() => {
      if (this.configResource.error()) {
        console.warn('Usando configuración por defecto debido a un fallo en la carga.');
      }
    });
  }

  private filterInvalidConfig(fetchedConfig: ClientConfig | undefined): ClientConfig {
    return fetchedConfig ?? this.defaultValues;
  }
}
