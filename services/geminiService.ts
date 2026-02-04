import { GoogleGenAI, Type } from "@google/genai";
import { Character, SagaLogEntry, SagaContent } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const atributoSchema = {
    type: Type.OBJECT,
    properties: {
        nombre: { type: Type.STRING, description: "Nombre del atributo (ej: 'FE', 'SABIDURÍA')." },
        valor: { type: Type.STRING, description: "Valor del atributo (ej: '10/10')." },
        descripcion: { type: Type.STRING, description: "Descripción del atributo y su significado para el héroe." },
    },
    required: ["nombre", "valor", "descripcion"],
};

const habilidadSchema = {
    type: Type.OBJECT,
    properties: {
        nombre: { type: Type.STRING, description: "Nombre de la habilidad, talento o don (ej: 'RIQUEZA (Nivel Roto)')." },
        descripcion: { type: Type.STRING, description: "Descripción de la habilidad." },
    },
    required: ["nombre", "descripcion"],
};

const arcoSeccionSchema = {
    type: Type.OBJECT,
    properties: {
        titulo: { type: Type.STRING, description: "Título de la sección del arco argumental (ej: 'I. Título del Arco', 'II. El Catalizador (Acto I...)')." },
        contenido: { type: Type.STRING, description: "Contenido detallado de esta sección del arco, manteniendo la estructura y el formato del lore." },
    },
    required: ["titulo", "contenido"],
};

const vinculoSchema = {
    type: Type.OBJECT,
    properties: {
        nombre: { type: Type.STRING, description: "Nombre de la persona o entidad relacionada." },
        tipo: { type: Type.STRING, description: "Tipo de relación (ej: 'Mentor', 'Rival', 'Vínculo Tóxico', 'Nakama')." },
        descripcion: { type: Type.STRING, description: "Descripción de la dinámica de esta relación y su impacto en el héroe." },
    },
    required: ["nombre", "tipo", "descripcion"],
};


const characterSchema = {
    type: Type.OBJECT,
    properties: {
        heroe: { type: Type.STRING, description: "El nombre del héroe bíblico." },
        titulo: { type: Type.STRING, description: "Un título épico para el héroe." },
        rol: { type: Type.STRING, description: "El rol del personaje en la saga (ej: 'Héroe Vínculo (Inesperado) / Marginada')." },
        faccion: { type: Type.STRING, description: "La facción a la que pertenece y su estatus (ej: 'Israel (Marginada) / Técnica Rota')." },
        fraseCelebre: { type: Type.STRING, description: "Una cita icónica y memorable que encapsule la personalidad o destino del héroe." },
        atributosAlma: {
            type: Type.OBJECT,
            properties: {
                descripcion: { type: Type.STRING, description: "Descripción general de los atributos del 'Alma' (Capa 3)." },
                estadisticas: { type: Type.ARRAY, items: atributoSchema, description: "Lista de los atributos principales: FE, SABIDURÍA, PACTO." },
            },
            required: ["descripcion", "estadisticas"],
        },
        debilidadAlma: {
            type: Type.OBJECT,
            properties: {
                descripcion: { type: Type.STRING, description: "La debilidad principal del 'Alma', su vulnerabilidad a la 'Corrupción'." },
            },
            required: ["descripcion"],
        },
        habilidades: {
            type: Type.OBJECT,
            properties: {
                talentos: { type: Type.ARRAY, items: habilidadSchema, description: "Lista de 'TALENTOS' (habilidades humanas, Técnica - Capa 2.2)." },
                dones: { type: Type.ARRAY, items: habilidadSchema, description: "Lista de 'DONES' (poderes divinos, Vínculo - Capa 2)." },
            },
            required: ["talentos", "dones"],
        },
        vinculosClave: {
            type: Type.OBJECT,
            properties: {
                descripcion: { type: Type.STRING, description: "Un párrafo sobre las relaciones más importantes del héroe (Capa 4)." },
                vinculos: { type: Type.ARRAY, items: vinculoSchema, description: "Una lista de 2-3 relaciones clave (aliados, mentores, rivales, etc.)." },
            },
            required: ["descripcion", "vinculos"],
        },
        imagenPrompt: { type: Type.STRING, description: "Un prompt muy detallado EN INGLÉS para generar una imagen del personaje al estilo anime épico, dramático y oscuro. Debe describir la escena, la emoción y la acción clave del personaje." },
        arcoDetallado: {
            type: Type.OBJECT,
            properties: {
                titulo: { type: Type.STRING, description: "El título completo del arco argumental principal del héroe." },
                secciones: { type: Type.ARRAY, items: arcoSeccionSchema, description: "Una lista de las secciones que componen el arco argumental, desglosado en actos." },
            },
            required: ["titulo", "secciones"],
        },
    },
    required: ["heroe", "titulo", "rol", "faccion", "fraseCelebre", "atributosAlma", "debilidadAlma", "habilidades", "vinculosClave", "imagenPrompt", "arcoDetallado"],
};

export async function generateCharacterData(heroName: string, masterPrompt: string): Promise<Character> {
    const prompt = masterPrompt.replace('%%HERO_NAME%%', heroName);

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: characterSchema,
        },
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) {
        throw new Error("Received empty response from API for character data.");
    }

    try {
        const characterData: Character = JSON.parse(jsonStr);
        return characterData;
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonStr, e);
        throw new Error("Could not parse character data from the API.");
    }
}

export async function generateCharacterImage(prompt: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            imageConfig: {
                aspectRatio: "3:4"
            }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    
    throw new Error("No image was generated by the API for character.");
}

export async function generateSagaImage(narrative: string, character: Character): Promise<string> {
    const isAntagonist = /antagonista|corrupción|caído|malo/i.test(character.rol);

    const stylePrompt = isAntagonist
        ? "A dark, dramatic, and ominous anime style. The lighting should be somber and shadowy, emphasizing the character's corruption or inner conflict. The atmosphere must be tense and heavy."
        : "A vibrant, luminous, and majestic anime style. The image should radiate with heroic energy, divine greatness, clarity, and hope. Use bright, clear colors and epic, awe-inspiring lighting. It should feel like a legendary moment from a sacred text brought to life.";

    let specialInstructions = '';
    if (character.heroe.toLowerCase().includes('jesús') || character.heroe.toLowerCase().includes('jesus')) {
        specialInstructions = `
        **CRITICAL INSTRUCTION: The face of Jesus MUST NOT be visible.** 
        Portray him from behind, with his face obscured by a brilliant light, or focus the composition on his hands, feet, or silhouette. The goal is to avoid idolatry and maintain a sense of divine mystery.
        `;
    }

    const prompt = `
    **Base Character:** ${character.imagenPrompt}
    **New Scene:** The character is now in the middle of this scene: "${narrative}".
    ${specialInstructions}
    **Task:** Generate a new image that captures the essence of this new scene, maintaining the same base character design but adapting the mood to the style described below.

    **Style Instructions:** ${stylePrompt}

    The final image should feel like a key panel from a legendary graphic novel. Focus on the core action or emotion of the scene.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            imageConfig: {
                aspectRatio: "16:9"
            }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    
    throw new Error("No image was generated by the API for the saga scene.");
}

const sagaContentSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['narrative', 'dialogue'], description: "El tipo de contenido. 'narrative' para descripciones, 'dialogue' para conversaciones." },
        speaker: { type: Type.STRING, description: "El nombre del personaje que habla. Requerido si el tipo es 'dialogue'.", nullable: true },
        text: { type: Type.STRING, description: "El texto de la narrativa o el diálogo." }
    },
    required: ['type', 'text']
};

const sagaContinuationSchema = {
    type: Type.OBJECT,
    properties: {
        content: { 
            type: Type.ARRAY, 
            items: sagaContentSchema,
            description: "Una matriz de contenido de la historia, que puede ser 'narrativa' o 'diálogo'." 
        },
        choices: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Una lista de 2 a 3 nuevas opciones para el jugador. Una opción debe reflejar 'Técnica' (habilidad humana, astucia) y otra 'Vínculo' (fe, poder divino)."
        },
        isFinalChapter: { type: Type.BOOLEAN, description: "Verdadero si este es el segmento final del arco argumental del personaje." }
    },
    required: ["content", "choices", "isFinalChapter"],
};

export async function generateSagaContinuation(
    character: Character, 
    storyLog: SagaLogEntry[],
    playerChoice: string
): Promise<{ content: SagaContent[]; choices: string[]; isFinalChapter: boolean }> {
    const context = `
    Eres un 'Dungeon Master' y teólogo experto para el universo de 'Épicos de la Fe', un RPG de ficción interactiva.
    Tu tarea es continuar la saga del héroe de una manera **profundamente teológica, bíblica y existencial**, basándote en la elección del jugador.

    CONTEXTO DEL PERSONAJE:
    Héroe: ${character.heroe}
    Título: ${character.titulo}
    Rol: ${character.rol}
    Debilidad: ${character.debilidadAlma.descripcion}
    Habilidades Clave: ${[...character.habilidades.talentos, ...character.habilidades.dones].map(h => h.nombre).join(', ')}
    Arco Argumental General: ${character.arcoDetallado.titulo}

    HISTORIA HASTA AHORA:
    ${storyLog.map(entry => {
        const contentText = entry.content.map(c => 
            c.type === 'dialogue' ? `${c.speaker}: "${c.text}"` : c.text
        ).join('\n');
        return `ESCENA:\n${contentText}\n\nJUGADOR ELIGIÓ: ${entry.choiceMade || '(Inicio de la saga)'}`;
    }).join('\n\n---\n\n')}

    LA ÚLTIMA ELECCIÓN DEL JUGADOR FUE: "${playerChoice}"

    TAREA PRINCIPAL:
    Basado en la elección del jugador ("${playerChoice}"), genera una **escena extensa, rica y con gran profundidad narrativa**. La respuesta debe ser larga y detallada, dando al jugador mucho contenido para leer e interactuar antes de la siguiente elección.

    REQUISITOS INNEGOCIABLES:

    1.  **PROFUNDIDAD TEOLÓGICA Y BÍBLICA:**
        *   La narrativa debe ser más que una simple secuencia de eventos. Explora los pensamientos internos del héroe, sus luchas de fe, sus dudas teológicas, y las promesas bíblicas que resuenan en su mente.
        *   Utiliza activamente la terminología del lore: 'Vínculo' (la conexión con Dios), 'Técnica' (la habilidad humana), 'Alma' (el campo de batalla interno), y 'Corrupción' (la debilidad espiritual). Muestra, no solo digas, cómo estos conceptos están en juego.

    2.  **CONEXIÓN PASADO-PRESENTE-FUTURO:**
        *   PASADO: Muestra su impacto. Flashbacks o recuerdos vívidos.
        *   PRESENTE: Inmersión total. Monólogo interno del alma.
        *   FUTURO: Insinúa el destino a través de símbolos o palabras proféticas.

    3.  **CONTENIDO EXTENSO Y SEGMENTADO:**
        *   Mínimo de 8 a 12 bloques de contenido.
        *   Variedad entre 'narrative' y 'dialogue'.

    4.  **OPCIONES SIGNIFICATIVAS:** Presenta 2 o 3 opciones que dividan claramente entre confiar en la 'Técnica' o el 'Vínculo'.

    5.  **FORMATO JSON:** Responde EXCLUSIVAMENTE con el JSON estructurado.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: context,
        config: {
            responseMimeType: "application/json",
            responseSchema: sagaContinuationSchema,
        },
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) {
        throw new Error("Received empty response from API for saga continuation.");
    }

    try {
        const sagaData = JSON.parse(jsonStr);
        return sagaData;
    } catch (e) {
        console.error("Failed to parse JSON response for saga:", jsonStr, e);
        throw new Error("Could not parse saga data from the API.");
    }
}