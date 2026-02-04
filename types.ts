export interface Atributo {
  nombre: string;
  valor: string;
  descripcion: string;
}

export interface Habilidad {
  nombre: string;
  descripcion: string;
}

export interface ArcoSeccion {
  titulo: string;
  contenido: string;
}

export interface Vinculo {
  nombre: string;
  tipo: string;
  descripcion: string;
}

export interface Character {
  heroe: string;
  titulo: string;
  rol: string;
  faccion: string;
  fraseCelebre: string;
  atributosAlma: {
    descripcion: string;
    estadisticas: Atributo[];
  };
  debilidadAlma: {
    descripcion: string;
  };
  habilidades: {
    talentos: Habilidad[];
    dones: Habilidad[];
  };
  vinculosClave: {
    descripcion: string;
    vinculos: Vinculo[];
  };
  imagenPrompt: string; // The prompt is expected to be in English.
  arcoDetallado: {
    titulo: string;
    secciones: ArcoSeccion[];
  };
}

export interface CharacterWithImage extends Character {
  id: string;
  imageUrl: string;
}

export interface StoryArc {
  titulo: string;
  secciones: ArcoSeccion[];
}

export type SagaContent = {
    type: 'narrative';
    text: string;
} | {
    type: 'dialogue';
    speaker: string;
    text: string;
};

export interface SagaLogEntry {
  content: SagaContent[];
  choiceMade?: string;
  imageUrl?: string;
}

export interface Saga {
  heroId: string;
  log: SagaLogEntry[];
  currentChoices: string[];
  isComplete: boolean;
}
