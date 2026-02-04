import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Character, CharacterWithImage, Saga, SagaLogEntry } from './types';
import { generateCharacterData, generateCharacterImage } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';

const GeneratorView = lazy(() => import('./components/GeneratorView'));
const GalleryView = lazy(() => import('./components/GalleryView'));
const SagaPlayer = lazy(() => import('./components/SagaPlayer'));
const ChroniclesView = lazy(() => import('./components/ChroniclesView'));


const defaultMasterPrompt = `
⚔️ Plantilla Modular de Personaje Bíblico (Estilo Anime Épico) 📜

Eres un 'Lore Master' para el universo de 'Épicos de la Fe', un RPG de ficción interactiva basado en un sistema teológico de 4 capas.
Tu tarea es generar una ficha de personaje modular y detallada para el héroe bíblico: **%%HERO_NAME%%**.

El tono debe ser épico, dramático y con un toque oscuro, similar a series como 'Castlevania', 'Berserk' o 'Vinland Saga'.
Evita iconografía o terminología que sea exclusiva de una denominación específica (ej. católica). La interpretación debe ser ampliamente cristiana y basada en textos bíblicos aceptados por protestantes y evangélicos.
Toda la salida de texto, EXCEPTO el 'imagenPrompt', debe estar en **español**.
El 'imagenPrompt' debe estar en **inglés**.

Utiliza la siguiente plantilla y estructura para generar el JSON. Sigue la estructura del lore y la terminología específica ('Vínculo', 'Técnica', 'Corrupción', 'Alma', Capas, etc.) de manera consistente.

**Estructura de la Ficha:**

1.  **Información General:**
    *   \`heroe\`: Nombre del personaje.
    *   \`titulo\`: Título épico.
    *   \`rol\`: Su rol en la historia.
    *   \`faccion\`: Facción y estatus.
    *   \`fraseCelebre\`: Una cita icónica y memorable que encapsule su personalidad o su destino.

2.  **Atributos del "Alma" (Capa 3):**
    *   \`descripcion\`: Un párrafo introductorio sobre su Alma.
    *   \`estadisticas\`: Un array con sus atributos de FE, SABIDURÍA y PACTO, incluyendo valor (ej: "8/10") y una breve descripción.

3.  **Debilidad del "Alma" (Corrupción):**
    *   \`descripcion\`: Describe su vulnerabilidad principal, la 'Corrupción' que lo amenaza.

4.  **Árbol de Habilidades (Dones vs. Talentos):**
    *   \`talentos\`: Un array de sus habilidades humanas ('Técnica').
    *   \`dones\`: Un array de sus poderes divinos ('Vínculo').

5.  **Vínculos Clave (Capa 4):**
    *   \`descripcion\`: Un párrafo sobre sus relaciones más importantes.
    *   \`vinculos\`: Un array de 2-3 relaciones clave (aliados, mentores, rivales, familia). Cada una con \`nombre\`, \`tipo\` (ej: 'Mentor', 'Vínculo Tóxico'), y \`descripcion\`.

6.  **Generador de Imagen:**
    *   \`imagenPrompt\`: Un prompt detallado y evocador EN INGLÉS para generar la imagen. Debe ser vívido y cinematográfico.
        *   **Estilo:** "epic anime style, dark fantasy, dramatic lighting, detailed character design, style of Castlevania series, Kentaro Miura, Ayami Kojima".
        *   **Composición:** Describe una pose dinámica, una expresión facial intensa, el entorno y la atmósfera. Captura un momento clave de su historia, lleno de emoción.
        *   **Instrucción Especial para Jesús:** Si el héroe es Jesús, su rostro NUNCA debe ser visible. Muéstralo desde atrás, con el rostro oscurecido por la luz, o enfócate en sus manos o pies. El objetivo es evitar la idolatría y mantener un sentido de reverencia y misterio. El prompt DEBE reflejar esto explícitamente (ej: "Jesus from behind", "face obscured by light").
        *   **Ejemplo:** "Full body portrait of a battle-hardened Samson, screaming in fury as he pushes apart two massive stone pillars of a pagan temple. His long, dark hair flows wildly. Muscles strained, eyes glowing with divine power. Dramatic, cinematic lighting from collapsing ceiling. Debris and dust fill the air. Epic dark fantasy anime style, intricate details, style of Kentaro Miura."

7.  **Arco Argumental Detallado (Estructura de 6 Actos):**
    *   **Instrucción Clave:** Expande cada acto con puntos de trama específicos e interacciones de personajes, centrándote en la interacción entre 'Vínculo' (Poder Divino), 'Técnica' (Habilidad Humana) y 'Alma' (Voluntad Interior). Asegúrate de que la narrativa se alinee con el lore establecido del personaje y los elementos temáticos.
    *   \`titulo\`: El título completo de su arco principal.
    *   \`secciones\`: Un array de 6 secciones que desglosan la historia en los siguientes actos clave. Cada sección debe ser rica en detalles, explorando la teología y la psicología del personaje.
        *   **1. Acto I - El Catalizador:** Situación inicial: Define el equilibrio actual entre 'Vínculo' y 'Técnica'. Introduce el conflicto mediante una interacción específica con un aliado o rival (Capa 4) que expone la 'Debilidad del Alma'. ¿Qué evento rompe su normalidad?
        *   **2. Acto II - La Prueba:** El conflicto escala. El héroe intenta usar su 'Técnica' para resolver el problema, pero se encuentra con un obstáculo insuperable o una tentación. Detalla una escena específica de fracaso, resistencia o duda donde la 'Corrupción' amenaza con entrar.
        *   **3. El Punto Medio - El "Alma" en la Balanza:** Giro dramático. Una revelación, derrota o encuentro divino obliga al héroe a una introspección profunda. Describe la batalla interna en la Capa 3 (Alma): el héroe debe elegir conscientemente entre confiar en su propia fuerza ('Técnica') o rendirse a la voluntad divina ('Vínculo').
        *   **4. Acto III - El Clímax Épico:** La resolución del conflicto. Describe visualmente el 'Acto de Dominio'. ¿Es un milagro masivo, una victoria militar estratégica o un sacrificio personal? Muestra explícitamente cómo la elección del Punto Medio determina el éxito o la tragedia. Usa lenguaje cinematográfico.
        *   **5. La Caída o Ascenso - El Legado Inmediato:** Consecuencias inmediatas para la 'Facción' y el entorno. ¿Es el héroe exaltado, humillado o martirizado? Describe una interacción final significativa con el antagonista, un mentor o los beneficiarios de su acción.
        *   **6. Resolución y "Plot Hook":** Cierre teológico y enlace. Resume la enseñanza sobre la relación Vínculo/Técnica aprendida en este arco. Introduce explícitamente la siguiente amenaza, profecía o el siguiente personaje que heredará el conflicto, conectando con la saga mayor.

**A continuación se muestra un ejemplo de la calidad y profundidad que se espera para la sección 'Arco Argumental Detallado'. Úsalo como guía de estilo, tono y estructura:**

<ejemplo>
### 🎬 Arco Argumental 127: El Rey de la Corrupción (Arco de Manasés)

**I. Título del Arco:**
Temporada 127: El "Vínculo" Corrompido (Arco de Manasés)

**II. Acto I - El Catalizador (El Héroe Caído Definitivo):**
* **Situación Inicial:** El Héroe Rey (Ezequías - Arco 126) muere (Técnica Rota). Su hijo **Manasés** (Antagonista/Héroe Caído) toma el Trono (Técnica).
* **El Incidente (La "Corrupción" Total en el "Reactor"):** (2 Reyes 21) Manasés (Alma Corrupta) *desata* toda la "Técnica Corrupta". Reconstruye altares paganos, adora a las estrellas, y los coloca *DENTRO* del Templo (Reactor), el acto de corrupción máximo. Sacrifica a su propio hijo en el fuego (Técnica Corrupta/Moloc).

**III. Acto II - La Prueba (El Juicio del "Vínculo"):**
* **El Conflicto:** El "Vínculo" (Dios) habla a través de sus Profetas (Héroes Vínculo), advirtiendo del juicio inminente. La sentencia es clara: Jerusalén será "limpiada como un plato, que se limpia y se vuelve boca abajo" (Juicio/Vínculo Roto).
* **La Lucha:** Manasés (Alma Corrupta) se enfrenta a esta prueba de fe, la oportunidad de arrepentirse.

**IV. El Punto Medio - El "Alma" en la Balanza (El Rechazo y la Sangre):**
* **El Dilema:** En lugar de escuchar, el "Alma" de Manasés se endurece. Elige su "Técnica" (poder real) sobre el "Vínculo" (advertencia divina).
* **El Giro:** Comete su acto definitorio de maldad: Rechaza a los profetas y derrama "mucha sangre inocente". La tradición judía sostiene que ejecutó al profeta Isaías (su Vínculo de Relación/Mentor) aserrándolo por la mitad. No hay vuelta atrás.

**V. Acto III - El Clímax Épico (El "Arrepentimiento" Forzado):**
* **La Confrontación Final:** El "Vínculo" (Dios) activa la "Técnica" de la facción Asiria (Juicio). Capturan a Manasés.
* **El "Acto de Dominio":** Roto, encadenado y humillado en una prisión de Babilonia, su "Técnica" es inútil. Su "Alma" (Capa 3) finalmente se quiebra.
* **El Clímax del Alma:** En la desesperación total, ora y se humilla "grandemente". Es el arrepentimiento más profundo posible, nacido no de la piedad, sino de la aniquilación total de su orgullo.

**VI. La Caída o Ascenso - El Legado Inmediato (La Gracia Inesperada):**
* **El Ascenso:** El "Vínculo" (Gracia) responde. Dios escucha su oración y lo *restaura* a su reino en Jerusalén. Manasés, el Héroe Restaurado, ahora usa su "Técnica" para purgar los ídolos que él mismo construyó.
* **La Caída (El Daño Colateral):** Aunque su "Alma" es salva, la "Corrupción" que sembró en el "Alma" de la nación es demasiado profunda. El daño ya está hecho.

**VII. Resolución y "Plot Hook" (El Rey Niño):**
* **La Lección:** La Gracia del "Vínculo" es tan poderosa que puede perdonar hasta la "Corrupción" más extrema si el arrepentimiento es genuino.
* **Resolución:** Manasés muere. Su hijo Amón es malo y es asesinado.
* **"Plot Hook":** El pueblo, desesperado, toma al nieto de Manasés, **JOSÍAS**, un niño de solo *ocho años*, y lo corona rey. El escenario está listo para el Arco 128: El Rey Niño y el Libro Perdido.
</ejemplo>
`;

const saveSagasToLocalStorage = (sagas: { [heroId: string]: Saga }): { success: boolean; message?: string } => {
    try {
        // Sanitize sagas to remove large image data before saving to prevent quota errors.
        const sagasToSave: { [heroId: string]: Saga } = {};
        Object.keys(sagas).forEach(heroId => {
            const originalSaga = sagas[heroId];
            if (originalSaga) {
                const sanitizedLog = originalSaga.log.map((entry, index) => {
                    // Keep the imageUrl for the first entry (hero portrait), remove for all others.
                    if (index > 0) {
                        const { imageUrl, ...rest } = entry;
                        return rest as SagaLogEntry;
                    }
                    return entry;
                });
    
                sagasToSave[heroId] = {
                    ...originalSaga,
                    log: sanitizedLog,
                };
            }
        });
        localStorage.setItem('heroSagas', JSON.stringify(sagasToSave));
        return { success: true };
    } catch (err) {
        let message = "Error desconocido al guardar el progreso.";
        if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
             message = "Error de almacenamiento: Se ha excedido la cuota del navegador. No se pudo guardar el progreso.";
        }
        console.error("Failed to save sagas to localStorage", err);
        return { success: false, message: message };
    }
};


const App = () => {
    const [activeView, setActiveView] = useState<'generator' | 'gallery' | 'codex'>('generator');
    
    // State for the generator
    const [character, setCharacter] = useState<Character | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [heroName, setHeroName] = useState<string>('');
    
    // State for the gallery
    const [gallery, setGallery] = useState<CharacterWithImage[]>([]);

    // State for Sagas
    const [sagas, setSagas] = useState<{ [heroId: string]: Saga }>({});
    const [activeSagaHero, setActiveSagaHero] = useState<CharacterWithImage | null>(null);

    // State for navigation from chronicles
    const [navRequest, setNavRequest] = useState<{ heroName: string; sectionTitle: string } | null>(null);

    // Load from localStorage on initial render
    useEffect(() => {
        try {
            const savedGallery = localStorage.getItem('heroGallery');
            if (savedGallery) setGallery(JSON.parse(savedGallery));
            
            const savedSagas = localStorage.getItem('heroSagas');
            if (savedSagas) setSagas(JSON.parse(savedSagas));
        } catch (err) {
            console.error("Failed to load from localStorage", err);
        }
    }, []);

    // Save gallery to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('heroGallery', JSON.stringify(gallery));
        } catch (err) {
            console.error("Failed to save gallery to localStorage", err);
        }
    }, [gallery]);
    
    useEffect(() => {
        // Clear navRequest if user navigates away from gallery manually
        if (activeView !== 'gallery' && navRequest) {
            setNavRequest(null);
        }
    }, [activeView, navRequest]);


    const handleGenerate = async () => {
        if (!heroName.trim()) {
            setError("Por favor, introduce el nombre de un héroe.");
            return;
        }
        setIsLoading(true);
        setIsImageLoading(false);
        setError(null);
        setCharacter(null);
        setImageUrl(null);

        try {
            const charData = await generateCharacterData(heroName, defaultMasterPrompt);
            setCharacter(charData);
            setIsLoading(false); 

            setIsImageLoading(true);
            const imgUrl = await generateCharacterImage(charData.imagenPrompt);
            setImageUrl(imgUrl);

            const newHero: CharacterWithImage = {
                id: `${Date.now()}-${charData.heroe.replace(/\s+/g, '-')}`,
                ...charData,
                imageUrl: imgUrl,
            };
            setGallery(prevGallery => [newHero, ...prevGallery]);
            // Also update the character state to be the full CharacterWithImage
            setCharacter(newHero); 

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Ocurrió un error desconocido al generar el héroe.");
            setIsLoading(false);
        } finally {
            setIsImageLoading(false);
        }
    };

    const handleStartSaga = (hero: CharacterWithImage) => {
        setActiveSagaHero(hero);
    };

    const handleExitSaga = () => {
        setActiveSagaHero(null);
    };

    const handleSagaUpdate = (updatedSaga: Saga): { success: boolean; message?: string } => {
        const newSagas = { ...sagas, [updatedSaga.heroId]: updatedSaga };
        setSagas(newSagas);
        return saveSagasToLocalStorage(newSagas);
    };

    const handleChronicleNav = (heroName: string, sectionTitle: string) => {
        const hero = gallery.find(h => h.heroe.toLowerCase().trim() === heroName.toLowerCase().trim());
        if (!hero) {
            setActiveView('generator');
            setHeroName(heroName);
            setError(`"${heroName}" no está en tu galería. ¡Genéralo para ver su crónica completa!`);
            setNavRequest(null);
        } else {
            setActiveView('gallery');
            setNavRequest({ heroName, sectionTitle });
        }
    };


    const renderMainView = () => {
        switch (activeView) {
            case 'generator':
                return (
                    <GeneratorView 
                        character={character as CharacterWithImage | null}
                        imageUrl={imageUrl}
                        isLoading={isLoading}
                        isImageLoading={isImageLoading}
                        error={error}
                        heroName={heroName}
                        setHeroName={setHeroName}
                        handleGenerate={handleGenerate}
                        handleStartSaga={handleStartSaga}
                    />
                );
            case 'gallery':
                return (
                    <GalleryView 
                        gallery={gallery}
                        setGallery={setGallery}
                        handleStartSaga={handleStartSaga}
                        sagas={sagas}
                        navRequest={navRequest}
                    />
                );
            case 'codex':
                return <ChroniclesView onNavigate={handleChronicleNav} />;
            default:
              return null;
        }
    };

    return (
        <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><LoadingSpinner /></div>}>
            {activeSagaHero ? (
                <SagaPlayer 
                    hero={activeSagaHero}
                    saga={sagas[activeSagaHero.id] || null}
                    onSagaUpdate={handleSagaUpdate}
                    onExit={handleExitSaga}
                />
            ) : (
                <main className="app-container">
                    <header className="app-header">
                        <h1 className="app-title">Épicos de la Fe</h1>
                        <h2 className="app-subtitle">Personajes Forjados por la Palabra, Listos para ser conocidos</h2>
                    </header>
                    
                    <nav className="app-nav">
                        <button 
                            className={`nav-button ${activeView === 'generator' ? 'nav-button-active' : ''}`}
                            onClick={() => setActiveView('generator')}
                            aria-pressed={activeView === 'generator'}
                        >
                            Inicio
                        </button>
                        <button 
                            className={`nav-button ${activeView === 'gallery' ? 'nav-button-active' : ''}`}
                            onClick={() => setActiveView('gallery')}
                            aria-pressed={activeView === 'gallery'}
                        >
                            Personajes (Galería)
                        </button>
                        <button 
                            className={`nav-button ${activeView === 'codex' ? 'nav-button-active' : ''}`}
                            onClick={() => setActiveView('codex')}
                            aria-pressed={activeView === 'codex'}
                        >
                            Crónicas
                        </button>
                    </nav>

                    <div key={activeView} className="fade-in" style={{width: '100%'}}>
                        {renderMainView()}
                    </div>
                </main>
            )}
        </Suspense>
    );
};

export default App;