import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CharacterWithImage, Saga, SagaLogEntry, SagaContent } from '../types';
import { generateSagaContinuation, generateSagaImage } from '../services/geminiService';
import audioService, { SoundEffect, Theme } from '../services/audioService';

interface SagaPlayerProps {
    hero: CharacterWithImage;
    saga: Saga | null;
    onSagaUpdate: (saga: Saga) => { success: boolean; message?: string };
    onExit: () => void;
}

interface SagaPanelProps {
    heroName: string;
    entry: SagaLogEntry;
    isActive: boolean;
    activeContentIndex: number;
    showChoiceOnFirstPage: boolean;
    isFastMode: boolean;
}

// --- PARTICLE SYSTEM ---
type ParticleType = 'ember' | 'holy' | 'dust' | 'corruption' | 'rain';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    alpha: number;
    life: number;
    maxLife: number;
    type: ParticleType;
    color: string;
}

const SagaAtmosphere: React.FC<{ text: string, isActive: boolean }> = ({ text, isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    
    // Determine atmosphere type based on text content
    const atmosphereType = useMemo<ParticleType>(() => {
        const lowerText = text ? text.toLowerCase() : "";
        if (lowerText.match(/fuego|juicio|ira|ardiendo|guerra|sangre|infierno|destrucción/)) return 'ember';
        if (lowerText.match(/vínculo|luz|santo|gloria|dios|cielo|milagro|poder|resplandor/)) return 'holy';
        if (lowerText.match(/corrupción|oscuridad|tinieblas|miedo|muerte|demonio|mentira/)) return 'corruption';
        if (lowerText.match(/lluvia|tormenta|mar|agua|tristeza|llanto/)) return 'rain';
        return 'dust'; // Default
    }, [text]);

    const createParticle = useCallback((width: number, height: number, type: ParticleType): Particle => {
        const x = Math.random() * width;
        let y = Math.random() * height;
        let speedX = 0;
        let speedY = 0;
        let size = 0;
        let color = '';
        let life = 100;

        switch (type) {
            case 'ember':
                y = height + 10; // Start from bottom
                speedY = -(Math.random() * 1.5 + 0.5);
                speedX = (Math.random() - 0.5) * 1;
                size = Math.random() * 3 + 1;
                color = `rgba(255, ${Math.floor(Math.random() * 100)}, 0,`;
                life = Math.random() * 100 + 50;
                break;
            case 'holy':
                speedY = -(Math.random() * 0.5 + 0.1); // Slow rise
                speedX = (Math.random() - 0.5) * 0.5;
                size = Math.random() * 2 + 0.5;
                color = `rgba(255, 215, 0,`; // Gold
                life = Math.random() * 150 + 100;
                break;
            case 'corruption':
                speedY = -(Math.random() * 0.8 + 0.2);
                speedX = (Math.random() - 0.5) * 2; // Erratic
                size = Math.random() * 4 + 2;
                color = `rgba(75, 0, 130,`; // Purple/Black
                life = Math.random() * 120 + 80;
                break;
            case 'rain':
                y = -10; // Start from top
                speedY = Math.random() * 10 + 5; // Fast fall
                speedX = (Math.random() - 0.5) * 0.5;
                size = Math.random() * 1.5 + 0.5;
                color = `rgba(173, 216, 230,`; // Light blue
                life = 100;
                break;
            case 'dust':
            default:
                speedY = (Math.random() - 0.5) * 0.2;
                speedX = (Math.random() - 0.5) * 0.2;
                size = Math.random() * 2;
                color = `rgba(200, 200, 200,`;
                life = Math.random() * 300 + 200;
                break;
        }

        return { x, y, size, speedX, speedY, alpha: 0, life, maxLife: life, type, color };
    }, []);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Add new particles occasionally
        if (particlesRef.current.length < 100 && Math.random() < 0.1) {
             particlesRef.current.push(createParticle(canvas.width, canvas.height, atmosphereType));
        }

        // Update and draw
        for (let i = 0; i < particlesRef.current.length; i++) {
            const p = particlesRef.current[i];
            
            p.x += p.speedX;
            p.y += p.speedY;
            p.life--;

            // Fade in and out
            if (p.life > p.maxLife * 0.8) {
                p.alpha += 0.02;
            } else if (p.life < p.maxLife * 0.2) {
                p.alpha -= 0.02;
            }
            if (p.alpha > 1) p.alpha = 1;
            if (p.alpha < 0) p.alpha = 0;

            // Reset loop for rain
            if (p.type === 'rain' && p.y > canvas.height) {
                 p.y = -10;
                 p.life = p.maxLife;
            }

            // Remove dead particles
            if (p.life <= 0 && p.type !== 'rain') {
                particlesRef.current.splice(i, 1);
                i--;
                continue;
            }

            ctx.beginPath();
            ctx.fillStyle = `${p.color}${p.alpha})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [atmosphereType, createParticle]);

    useEffect(() => {
        if (!isActive) {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            return;
        }

        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Init size

        // Seed initial particles if ref is empty
        if (particlesRef.current.length === 0 && canvasRef.current) {
             for(let i=0; i<50; i++) {
                 const p = createParticle(canvasRef.current.width, canvasRef.current.height, atmosphereType);
                 p.alpha = Math.random(); // Start visible
                 p.y = Math.random() * canvasRef.current.height; // Random pos
                 particlesRef.current.push(p);
             }
        }

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [animate, isActive, atmosphereType, createParticle]);

    return <canvas ref={canvasRef} className={`saga-atmosphere-canvas ${isActive ? 'active' : ''}`} />;
};


// Helper to parse and highlight keywords
const renderHighlightedText = (text: string): React.ReactNode[] => {
    if (!text) return [];
    
    // Regex looks for keywords case-insensitive.
    const regex = /(Acto de Dominio|Espíritu Santo|Power-Up|Vínculo|Juicio|Corrupción|Técnica|Alma)/gi;
    const parts = text.split(regex);

    return parts.map((part, index) => {
        const lowerPart = part.toLowerCase();
        
        if (lowerPart === 'acto de dominio' || lowerPart === 'juicio' || lowerPart === 'power-up') {
            return <span key={index} className="kw-juicio">{part}</span>;
        }
        if (lowerPart.includes('vínculo') || lowerPart === 'espíritu santo') {
            return <span key={index} className="kw-vinculo">{part}</span>;
        }
        if (lowerPart === 'técnica') {
            return <span key={index} className="kw-tecnica">{part}</span>;
        }
        if (lowerPart === 'corrupción') {
            return <span key={index} className="kw-corrupcion">{part}</span>;
        }
         if (lowerPart === 'alma') {
            return <span key={index} className="kw-alma">{part}</span>;
        }
        
        return <span key={index}>{part}</span>;
    });
};

const Typewriter: React.FC<{ text: string; speed?: number; isFastMode: boolean; onComplete?: () => void }> = ({ text, speed = 20, isFastMode, onComplete }) => {
    const [displayedLength, setDisplayedLength] = useState(0);

    useEffect(() => {
        if (isFastMode) {
            setDisplayedLength(text.length);
            onComplete?.();
            return;
        }

        setDisplayedLength(0);
        let currentLength = 0;

        const timer = setInterval(() => {
            currentLength += 2;
            if (currentLength >= text.length) {
                currentLength = text.length;
                clearInterval(timer);
                onComplete?.();
            }
            setDisplayedLength(currentLength);
        }, speed);
        
        // Failsafe: Force complete if it takes too long (e.g. background throttling)
        const failsafeTime = text.length * speed + 1500;
        const failsafeTimer = setTimeout(() => {
            if (currentLength < text.length) {
                setDisplayedLength(text.length);
                clearInterval(timer);
                onComplete?.();
            }
        }, failsafeTime);

        return () => {
            clearInterval(timer);
            clearTimeout(failsafeTimer);
        };
    }, [text, speed, isFastMode]);

    const displayedText = text.substring(0, displayedLength);
    const showCursor = displayedLength < text.length;

    if (!displayedText && !showCursor) return <span style={{ display: 'inline-block', minHeight: '1em' }}>&nbsp;</span>;

    return (
        <span className={showCursor ? "typing-cursor" : ""}>
            {renderHighlightedText(displayedText)}
        </span>
    );
};

interface SagaDialogueItemProps {
    item: SagaContent & { type: 'dialogue' };
    speakerClass: string;
    contentElement: React.ReactNode;
}

const SagaDialogueItem: React.FC<SagaDialogueItemProps> = ({ item, speakerClass, contentElement }) => {
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
    };

    return (
        <div className={`saga-content-item dialogue ${speakerClass} fade-in-fast`}>
            <span className="speaker-name">{item.speaker}</span>
            <p className="dialogue-text" style={{ color: '#fff', margin: 0 }}>{contentElement}</p>
            <button 
                className={`saga-like-button ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                aria-label={isLiked ? "Quitar me gusta" : "Me gusta"}
                title="Me gusta este diálogo"
            >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
        </div>
    );
};

interface SagaNarrativeItemProps {
    contentElement: React.ReactNode;
}

const SagaNarrativeItem: React.FC<SagaNarrativeItemProps> = ({ contentElement }) => {
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
    };

    return (
        <div className="saga-content-item narrative fade-in-fast" style={{ minHeight: '1.5em' }}>
            {contentElement}
            <button 
                className={`saga-like-button ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                aria-label={isLiked ? "Quitar me gusta" : "Me gusta"}
                title="Me gusta este fragmento"
                style={{ right: '-10px', bottom: '-5px' }}
            >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
        </div>
    );
};

const SagaPanel: React.FC<SagaPanelProps> = ({ heroName, entry, isActive, activeContentIndex, showChoiceOnFirstPage, isFastMode }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [triggerJudgment, setTriggerJudgment] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const visibleContent = useMemo(() => 
        entry.content.slice(0, activeContentIndex + 1),
    [entry.content, activeContentIndex]);

    // Check for Judgment triggers
    useEffect(() => {
        if (!isActive) return;
        
        const latestItem = visibleContent[visibleContent.length - 1];
        if (latestItem) {
            const text = latestItem.text;
            const isIntense = /Acto de Dominio|Clímax|Visual \(Anime\)|JUICIO|VÍNCULO|Poder|Power-Up/i.test(text);
            
            if (isIntense) {
                setTriggerJudgment(true);
                audioService.playSound('judgment');
                const timer = setTimeout(() => setTriggerJudgment(false), 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [visibleContent, isActive]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            setTimeout(() => {
                 if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                 }
            }, 50);
        }
    }, [visibleContent, isActive]);

    useEffect(() => {
        setIsImageLoaded(false);
    }, [entry.imageUrl]);

    useEffect(() => {
        if (imgRef.current && imgRef.current.complete) {
            setIsImageLoaded(true);
        }
    }, []);

    const currentTextContext = visibleContent.map(c => c.text).join(' ');

    return (
        <div 
            className={`saga-panel ${isActive ? 'saga-panel-active' : ''} ${triggerJudgment ? 'shake-screen' : ''}`}
            style={{ 
                pointerEvents: isActive ? 'auto' : 'none',
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 1 : 0
            }}
        >
            {triggerJudgment && <div className="flash-overlay"></div>}
            
            {entry.imageUrl && !isImageLoaded && (
                <div className="saga-image-loader">
                     <div className="spinner"></div>
                     <span style={{fontSize: '0.8em', fontFamily: 'var(--font-primary)'}}>Materializando Visión...</span>
                </div>
            )}
            {entry.imageUrl && (
                <img 
                    ref={imgRef}
                    src={entry.imageUrl} 
                    alt={`Escena de la saga`} 
                    className={`saga-panel-background ${isImageLoaded ? 'image-loaded' : ''}`}
                    onLoad={() => setIsImageLoaded(true)}
                    style={{ zIndex: 0 }}
                />
            )}

            <SagaAtmosphere text={currentTextContext} isActive={isActive && isImageLoaded} />

            <div className="saga-content-overlay" style={{ zIndex: 10 }}>
                {showChoiceOnFirstPage && entry.choiceMade && <p className="saga-choice-made-text">Tu elección: "{entry.choiceMade}"</p>}
                
                <div ref={scrollContainerRef} className="saga-narrative-container">
                    {visibleContent.map((item, index) => {
                        const isLastItem = index === visibleContent.length - 1;
                        const isInteractive = isActive && isLastItem;
                        
                        const contentElement = isInteractive ? (
                            <Typewriter key={item.text} text={item.text} isFastMode={isFastMode} />
                        ) : (
                            renderHighlightedText(item.text)
                        );

                        if (item.type === 'narrative') {
                            return <SagaNarrativeItem key={`${index}-${item.text.substring(0,10)}`} contentElement={contentElement} />;
                        }
                        
                        const dialogueItem = item as SagaContent & { type: 'dialogue' };
                        const isHero = dialogueItem.speaker === heroName;
                        const speakerClass = isHero ? 'hero-speaker' : 'other-speaker';

                        return (
                            <SagaDialogueItem 
                                key={`${index}-${item.text.substring(0,10)}`}
                                item={dialogueItem}
                                speakerClass={speakerClass}
                                contentElement={contentElement}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const SagaPlayer: React.FC<SagaPlayerProps> = ({ hero, saga, onSagaUpdate, onExit }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Iniciando Saga...');
    const [error, setError] = useState<string | null>(null);
    const [activePanelIndex, setActivePanelIndex] = useState(0);
    const [activeContentIndex, setActiveContentIndex] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const lastLogLength = useRef(0);
    
    const [isAutoPlayOn, setIsAutoPlayOn] = useState(() => {
        return localStorage.getItem('saga_autoplay') === 'true';
    });
    const [isFastMode, setIsFastMode] = useState(() => {
        return localStorage.getItem('saga_fastmode') === 'true';
    });

    const [isMuted, setIsMuted] = useState(audioService.isMuted());
    const [selectedTheme, setSelectedTheme] = useState<Theme>('Journey');
    const [musicVolume, setMusicVolume] = useState(0.5);
    const [saveStatus, setSaveStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const autoplayTimeoutRef = useRef<number | null>(null);
    const saveStatusTimeoutRef = useRef<number | null>(null);


    const updateAndSaveSaga = useCallback((updatedSaga: Saga) => {
        const result = onSagaUpdate(updatedSaga);
        const statusType = result.success ? 'success' : 'error';
        const message = result.success ? 'Progreso guardado' : result.message || 'Error al guardar';
        
        setSaveStatus({ message, type: statusType });
        
        if (saveStatusTimeoutRef.current) {
            clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = window.setTimeout(() => {
            setSaveStatus(null);
        }, 3000);
    }, [onSagaUpdate]);

    useEffect(() => {
        localStorage.setItem('saga_autoplay', String(isAutoPlayOn));
    }, [isAutoPlayOn]);

    useEffect(() => {
        localStorage.setItem('saga_fastmode', String(isFastMode));
    }, [isFastMode]);

    useEffect(() => {
        return () => {
            audioService.stopAllAudio();
             if (saveStatusTimeoutRef.current) {
                clearTimeout(saveStatusTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (saga) {
            const currentLength = saga.log.length;

            if (lastLogLength.current === 0) {
                const isNewSaga = currentLength > 1 && saga.currentChoices[0] === "Forjar el siguiente capítulo.";
                if (isNewSaga) {
                    setActivePanelIndex(0);
                } else {
                    setActivePanelIndex(currentLength - 1);
                }
                setActiveContentIndex(0);
            } else if (currentLength > lastLogLength.current) {
                 setActivePanelIndex(currentLength - 1);
                 setActiveContentIndex(0);
            }
            lastLogLength.current = currentLength;
        }
    }, [saga]);

    useEffect(() => {
        audioService.playBackgroundMusic(selectedTheme);
    }, [selectedTheme]);

    useEffect(() => {
        audioService.setMusicVolume(musicVolume);
    }, [musicVolume]);

    useEffect(() => {
        if (!saga) {
            const arcPrologue: SagaLogEntry = {
                content: [
                    { type: 'narrative', text: `LA CRÓNICA DE ${hero.heroe.toUpperCase()}` },
                    { type: 'narrative', text: `La siguiente es la crónica canónica de ${hero.heroe}, que culmina en el momento en que su destino cae en tus manos.` }
                ],
                imageUrl: hero.imageUrl
            };

            const arcSectionEntries: SagaLogEntry[] = hero.arcoDetallado.secciones.map(section => ({
                content: [{ type: 'narrative', text: `${section.titulo}\n\n${section.contenido}` }],
                imageUrl: hero.imageUrl 
            }));

            const initialSaga: Saga = {
                heroId: hero.id,
                log: [arcPrologue, ...arcSectionEntries],
                currentChoices: ["Forjar el siguiente capítulo."],
                isComplete: false
            };

            updateAndSaveSaga(initialSaga);
            audioService.playSound('start');
        }
    }, [saga, hero, updateAndSaveSaga]);


    const currentContent = useMemo(() => {
        if (!saga) return [];
        if (activePanelIndex >= saga.log.length) return [];
        return saga.log[activePanelIndex].content;
    }, [saga, activePanelIndex]);


    const goToNext = useCallback(() => {
        if (!saga) return;
        
        const currentLogEntry = saga.log[activePanelIndex];
        if (!currentLogEntry) return;

        if (activeContentIndex < currentLogEntry.content.length - 1) {
            setActiveContentIndex(prev => prev + 1);
            audioService.playSound('navigate');
        } 
        else if (activePanelIndex < saga.log.length - 1) {
            setActivePanelIndex(prev => prev + 1);
            setActiveContentIndex(0);
            audioService.playSound('transition');
        }
    }, [saga, activeContentIndex, activePanelIndex]);

    const goToPrevious = useCallback(() => {
        if (!saga) return;

        if (activeContentIndex > 0) {
            setActiveContentIndex(prev => prev - 1);
            audioService.playSound('navigate');
        } 
        else if (activePanelIndex > 0) {
            const prevPanelIndex = activePanelIndex - 1;
            const prevContent = saga.log[prevPanelIndex].content;
            
            setActivePanelIndex(prevPanelIndex);
            setActiveContentIndex(prevContent.length - 1);
            audioService.playSound('transition');
        }
    }, [saga, activeContentIndex, activePanelIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isLoading) return;
            
            if (e.key === 'ArrowRight' || e.key === ' ') {
                const isAtEnd = activePanelIndex === (saga?.log.length || 0) - 1 && 
                                activeContentIndex === (currentContent.length || 0) - 1;
                
                if (!isAtEnd) {
                    goToNext();
                }
            } else if (e.key === 'ArrowLeft') {
                goToPrevious();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrevious, isLoading, activePanelIndex, activeContentIndex, saga, currentContent.length]);


    const calculateDelay = useCallback(() => {
        const currentText = currentContent[activeContentIndex]?.text || "";
        const wordCount = currentText.split(/\s+/).length;
        
        if (isFastMode) {
            return Math.max(1200, wordCount * 100 + 1000);
        } else {
            return Math.max(3000, wordCount * 300 + 2000);
        }
    }, [currentContent, activeContentIndex, isFastMode]);

    useEffect(() => {
        if (autoplayTimeoutRef.current) {
            clearTimeout(autoplayTimeoutRef.current);
        }

        if (isAutoPlayOn && saga) {
            const isAtTheVeryEnd = activePanelIndex === saga.log.length - 1 && activeContentIndex === currentContent.length - 1;
            
            if (!isAtTheVeryEnd) {
                 const delay = calculateDelay();
                 autoplayTimeoutRef.current = window.setTimeout(() => {
                    goToNext();
                }, delay);
            }
        }

        return () => {
            if (autoplayTimeoutRef.current) {
                clearTimeout(autoplayTimeoutRef.current);
            }
        };
    }, [isAutoPlayOn, isFastMode, activePanelIndex, activeContentIndex, saga, currentContent.length, goToNext, calculateDelay]);


    const handleChoice = async (choice: string) => {
        if (!saga || selectedChoice) return; 
        
        setSelectedChoice(choice);
        audioService.playSound('choice');

        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsLoading(true);
        setLoadingText('El Vínculo teje el destino...');
        setError(null);

        const logWithChoice = saga.log.map((entry, index) => {
            if (index === saga.log.length - 1) {
                return { ...entry, choiceMade: choice };
            }
            return entry;
        });

        try {
            const contextLog = [logWithChoice[logWithChoice.length - 1]];
            
            const result = await generateSagaContinuation(hero, contextLog, choice);
            
            const narrativeForImage = result.content.map(c => c.text).join(' ');
            const imageUrl = await generateSagaImage(narrativeForImage, hero);

            const nextLogEntry: SagaLogEntry = { 
                content: result.content,
                imageUrl: imageUrl 
            };
            
            const updatedSaga: Saga = {
                ...saga,
                log: [...logWithChoice, nextLogEntry],
                currentChoices: result.choices,
                isComplete: result.isFinalChapter
            };
            if (updatedSaga.isComplete) {
                audioService.playSound('complete');
            }
            updateAndSaveSaga(updatedSaga);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Ocurrió un error al continuar la saga.");
        } finally {
            setIsLoading(false);
            setSelectedChoice(null);
        }
    };

    const handleToggleMute = () => {
        audioService.toggleMute();
        setIsMuted(audioService.isMuted());
    };

    const renderLoading = () => (
        <div className="saga-loading">
            <div className="saga-loading-visualizer" role="progressbar" aria-label="La crónica se está tejiendo">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle className="symbol-ring symbol-ring-outer" cx="50" cy="50" r="45" />
                    <circle className="symbol-ring symbol-ring-inner" cx="50" cy="50" r="35" />
                    <path className="symbol-core" d="M50 40 L55 45 L60 50 L55 55 L50 60 L45 55 L40 50 L45 45 Z" />
                </svg>
            </div>
            <p className="spinner-text">{loadingText}</p>
        </div>
    );
    
    if (!saga) {
        return (
            <div className="saga-player">
                <div className="saga-loading">
                     <div className="spinner-container" role="status" aria-label="Cargando">
                        <div className="spinner"></div>
                        <p className="spinner-text">Cargando Crónica...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const isOnLastPanel = activePanelIndex === saga.log.length - 1 && activeContentIndex === currentContent.length - 1;
    const canGoNext = activePanelIndex < saga.log.length - 1 || activeContentIndex < currentContent.length - 1;
    const canGoPrevious = activePanelIndex > 0 || activeContentIndex > 0;
    
    const sceneCounterText = `Escena ${activePanelIndex + 1} / ${saga.log.length}`;
    const contentCounterText = currentContent.length > 1 ? `Línea ${activeContentIndex + 1} / ${currentContent.length}` : null;

    return (
        <div className={`saga-player ${isFastMode ? 'saga-player-fast-mode' : ''}`}>
            {isLoading && renderLoading()}
            
            <header className="saga-header">
                <div className="saga-hero-info">
                    <img src={hero.imageUrl} alt={hero.heroe} className="saga-hero-image"/>
                    <h1 className="saga-hero-name">{hero.heroe}</h1>
                </div>
                <div className="saga-header-controls">
                    <div className="saga-music-controls">
                        <label htmlFor="theme-select" className="visually-hidden">Tema Musical</label>
                        <select
                            id="theme-select"
                            className="saga-theme-select"
                            value={selectedTheme}
                            onChange={(e) => setSelectedTheme(e.target.value as Theme)}
                            aria-label="Seleccionar tema musical"
                        >
                            <option value="Journey">Viaje</option>
                            <option value="Battle">Batalla</option>
                            <option value="Sanctuary">Santuario</option>
                            <option value="Despair">Desesperación</option>
                            <option value="Mystery">Misterio</option>
                        </select>
                        <label htmlFor="volume-slider" className="visually-hidden">Volumen</label>
                        <input
                            id="volume-slider"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={musicVolume}
                            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                            className="saga-volume-slider"
                            aria-label="Control de volumen de la música"
                        />
                    </div>
                    <button onClick={handleToggleMute} className="saga-mute-button" aria-label={isMuted ? "Activar sonido" : "Silenciar sonido"}>
                        {isMuted ? (
                            <svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                        ) : (
                            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                        )}
                    </button>
                    <button onClick={onExit} className="saga-exit-button">
                        Salir de la Saga
                    </button>
                </div>
            </header>

            <div className="saga-panel-container">
                 {saga.log.map((entry, index) => (
                    <SagaPanel 
                        key={entry.imageUrl ? index : `panel-${index}`} 
                        heroName={hero.heroe}
                        entry={entry}
                        isActive={index === activePanelIndex}
                        activeContentIndex={index === activePanelIndex ? activeContentIndex : entry.content.length - 1}
                        showChoiceOnFirstPage={index === activePanelIndex && activeContentIndex === 0}
                        isFastMode={isFastMode}
                    />
                 ))}
            </div>
            
            {saveStatus && (
                <div className={`saga-save-status ${saveStatus.type}`} role="status">
                    {saveStatus.type === 'success' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    )}
                    <span>{saveStatus.message}</span>
                </div>
            )}

            <div className="saga-content-overlay">
                <div style={{flexGrow:1}}></div> 

                {error && <div className="error-message" role="alert"><p><strong>Error:</strong> {error}</p></div>}
            
                {isOnLastPanel && !saga.isComplete && (
                    <div className="saga-choices fade-in-fast">
                        {saga.currentChoices.map((choice, index) => (
                            <button 
                                key={index}
                                onClick={() => handleChoice(choice)}
                                className={`saga-choice-button ${selectedChoice === choice ? 'selected' : ''} ${selectedChoice && selectedChoice !== choice ? 'dimmed' : ''}`}
                                disabled={isLoading || (selectedChoice !== null && selectedChoice !== choice)}
                            >
                                {choice}
                            </button>
                        ))}
                    </div>
                )}

                {isOnLastPanel && saga.isComplete && (
                    <div className="saga-complete fade-in-fast">
                        <h2>FIN DE LA SAGA</h2>
                        <p>La crónica de {hero.heroe} ha llegado a su fin por ahora.</p>
                    </div>
                )}

                {saga.log.length > 0 && (
                    <div className="saga-controls-container">
                        <div className="saga-navigation">
                            <button
                                onClick={goToPrevious}
                                disabled={!canGoPrevious}
                                className="saga-nav-button"
                            >
                                &larr; Anterior
                            </button>
                            <div className="saga-panel-counter">
                                <span>{sceneCounterText}</span>
                                {contentCounterText && <span>{contentCounterText}</span>}
                            </div>
                            <button
                                onClick={goToNext}
                                disabled={!canGoNext}
                                className="saga-nav-button"
                            >
                                Siguiente &rarr;
                            </button>
                        </div>
                        <div className="saga-autoplay-controls">
                            <div className="saga-control-group">
                                <input
                                    type="checkbox"
                                    id="saga-autoplay"
                                    checked={isAutoPlayOn}
                                    onChange={(e) => setIsAutoPlayOn(e.target.checked)}
                                    aria-label="Activar avance automático de escenas"
                                />
                                <label htmlFor="saga-autoplay">Avance Automático</label>
                            </div>
                             <div className="saga-control-group">
                                <input
                                    type="checkbox"
                                    id="saga-fast-mode"
                                    checked={isFastMode}
                                    onChange={(e) => setIsFastMode(e.target.checked)}
                                    aria-label="Activar modo de historia rápida"
                                />
                                <label htmlFor="saga-fast-mode">Historia Rápida</label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SagaPlayer;