import React, { useState, useRef, useEffect } from 'react';
import { codexData } from '../data/codexData';
import { StoryArc } from '../types';
import CodexView from './CodexView';

interface CollapsibleArcProps {
    arc: StoryArc;
    isOpen: boolean;
    onToggle: () => void;
    onSectionClick: (sectionTitle: string) => void;
}

const CollapsibleArc: React.FC<CollapsibleArcProps> = ({ arc, isOpen, onToggle, onSectionClick }) => {
    return (
        <div className="arc-container">
            <button 
                onClick={onToggle} 
                className="arc-header"
                aria-expanded={isOpen}
            >
                <h2 className="arc-title">{arc.titulo}</h2>
                <span className="arc-toggle" aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
                <div className="arc-content">
                    {arc.secciones.map(seccion => (
                        <div key={seccion.titulo} className="arc-section">
                            <h3 className="arc-section-title">
                                <button className="arc-section-nav-button" onClick={() => onSectionClick(seccion.titulo)}>
                                    {seccion.titulo}
                                </button>
                            </h3>
                            <p className="arc-section-content">{seccion.contenido}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface ChroniclesViewProps {
    onNavigate: (heroName: string, sectionTitle: string) => void;
}

const ChroniclesView: React.FC<ChroniclesViewProps> = ({ onNavigate }) => {
    const [openArcIndex, setOpenArcIndex] = useState<number | null>(0);
    const [isNavigating, setIsNavigating] = useState(false);
    const arcRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        arcRefs.current = arcRefs.current.slice(0, codexData.length);
    }, []);

    useEffect(() => {
        if (openArcIndex !== null && arcRefs.current[openArcIndex]) {
            setIsNavigating(true);
            setTimeout(() => {
                arcRefs.current[openArcIndex]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                setTimeout(() => setIsNavigating(false), 500); 
            }, 100);
        }
    }, [openArcIndex]);

    const handleToggle = (index: number) => {
        if (isNavigating) return;
        setOpenArcIndex(openArcIndex === index ? null : index);
    };

    const handleSectionClick = (arcTitle: string, sectionTitle: string) => {
        const match = arcTitle.match(/\(Arco de (.*?)\)/);
        if (match && match[1]) {
            const heroName = match[1];
            onNavigate(heroName, sectionTitle);
        }
    };


    const handleNextArc = () => {
        if (isNavigating) return;
        const newIndex = openArcIndex === null 
            ? 0 
            : Math.min(openArcIndex + 1, codexData.length - 1);
        if (newIndex !== openArcIndex) {
            setOpenArcIndex(newIndex);
        }
    };

    const handlePreviousArc = () => {
        if (isNavigating) return;
        const newIndex = openArcIndex === null 
            ? codexData.length - 1
            : Math.max(openArcIndex - 1, 0);
        if (newIndex !== openArcIndex) {
            setOpenArcIndex(newIndex);
        }
    };
    
    const isAtStart = openArcIndex === 0;
    const isAtEnd = openArcIndex === codexData.length - 1;

    return (
        <div className="lore-view">
            <CodexView />

            <h2 className="lore-section-header">Crónicas de Ejemplo</h2>

            <nav className="chronicles-nav">
                <button 
                    onClick={handlePreviousArc} 
                    className="secondary-button" 
                    disabled={isNavigating || isAtStart}
                    aria-disabled={isNavigating || isAtStart}
                >
                    &larr; Arco Anterior
                </button>
                <button 
                    onClick={handleNextArc} 
                    className="secondary-button" 
                    disabled={isNavigating || isAtEnd}
                    aria-disabled={isNavigating || isAtEnd}
                >
                    Siguiente Arco &rarr;
                </button>
            </nav>
            
            {codexData.map((arc, index) => (
                // FIX: Changed arrow function to block body to prevent implicit return, satisfying the 'void' return type for the ref callback.
                <div key={index} ref={el => { arcRefs.current[index] = el; }}>
                    <CollapsibleArc 
                        arc={arc}
                        isOpen={openArcIndex === index}
                        onToggle={() => handleToggle(index)}
                        onSectionClick={(sectionTitle) => handleSectionClick(arc.titulo, sectionTitle)}
                    />
                </div>
            ))}
        </div>
    );
};

export default ChroniclesView;