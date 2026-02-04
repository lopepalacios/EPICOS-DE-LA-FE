import React, { useState, useEffect, useRef } from 'react';
import { CharacterWithImage, Saga } from '../types';
import CharacterSheet from './CharacterSheet';
import ImageGenerator from './ImageGenerator';

// --- ConfirmationModal component ---
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) {
        return null;
    }

    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-content" onClick={handleContentClick}>
                <h2 id="modal-title" className="modal-title">{title}</h2>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button onClick={onClose} className="secondary-button">Cancelar</button>
                    <button onClick={onConfirm} className="secondary-button delete-button">Confirmar Destierro</button>
                </div>
            </div>
        </div>
    );
};

// --- GalleryCard component ---
interface GalleryCardProps {
    hero: CharacterWithImage;
    sagaStatus: { text: string; className:string } | null;
    onClick: () => void;
    index: number;
}

const GalleryCard: React.FC<GalleryCardProps> = ({ hero, sagaStatus, onClick, index }) => {
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                // Start loading the image when it's 250px away from the viewport
                rootMargin: '0px 0px 250px 0px',
            }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                observer.unobserve(cardRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={cardRef}
            style={{ animationDelay: `${index * 0.05}s` }}
            className="gallery-card stagger-in"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyUp={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
        >
            {sagaStatus && (
                <div className={`gallery-card-status ${sagaStatus.className}`}>
                    {sagaStatus.text}
                </div>
            )}
            {/* The image is only rendered when it becomes visible */}
            {isVisible && (
                <img 
                    src={hero.imageUrl} 
                    alt={`Retrato de ${hero.heroe}`} 
                    className="gallery-card-image fade-in-fast" 
                />
            )}
            <div className="gallery-card-overlay">
                <h3 className="gallery-card-title">{hero.heroe}</h3>
            </div>
        </div>
    );
};


interface GalleryViewProps {
    gallery: CharacterWithImage[];
    setGallery: React.Dispatch<React.SetStateAction<CharacterWithImage[]>>;
    handleStartSaga: (hero: CharacterWithImage) => void;
    sagas: { [heroId: string]: Saga };
    navRequest: { heroName: string; sectionTitle: string } | null;
}

const GalleryView: React.FC<GalleryViewProps> = ({ gallery, setGallery, handleStartSaga, sagas, navRequest }) => {
    const [selectedHero, setSelectedHero] = useState<CharacterWithImage | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [heroToDelete, setHeroToDelete] = useState<CharacterWithImage | null>(null);
    const [scrollToSection, setScrollToSection] = useState<string | null>(null);

    useEffect(() => {
        if (navRequest) {
            const hero = gallery.find(h => h.heroe.toLowerCase().trim() === navRequest.heroName.toLowerCase().trim());
            if (hero) {
                setSelectedHero(hero);
                setScrollToSection(navRequest.sectionTitle);
            }
        }
    }, [navRequest, gallery]);

    const handleDidScroll = () => {
        setScrollToSection(null);
    };

    const requestDelete = (hero: CharacterWithImage) => {
        setHeroToDelete(hero);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!heroToDelete) return;
        setGallery(prevGallery => prevGallery.filter(hero => hero.id !== heroToDelete.id));
        
        // Close modal and clear state
        setIsDeleteModalOpen(false);
        setHeroToDelete(null);
        setSelectedHero(null); // Return to gallery grid
    };
    
    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setHeroToDelete(null);
    };

    const renderContent = () => {
        if (selectedHero) {
            const hasSaga = sagas[selectedHero.id];
            const sagaButtonText = hasSaga ? (hasSaga.isComplete ? "REPETIR SAGA" : "CONTINUAR SAGA") : "COMENZAR SAGA";
            
            return (
                <div className="gallery-detail-view">
                    <div className="gallery-detail-header">
                        <button onClick={() => setSelectedHero(null)} className="secondary-button">
                            &larr; Volver a la Galería
                        </button>
                        <div className="gallery-detail-actions">
                            <button onClick={() => handleStartSaga(selectedHero)} className="secondary-button">
                                {sagaButtonText}
                            </button>
                            <button onClick={() => requestDelete(selectedHero)} className="secondary-button delete-button">
                                Desterrar Héroe
                            </button>
                        </div>
                    </div>
                    <div className="hero-display-grid fade-in">
                        <div className="character-image-container">
                            <ImageGenerator 
                                imageUrl={selectedHero.imageUrl} 
                                characterName={selectedHero.heroe}
                                isLoading={false}
                            />
                        </div>
                        <div className="character-data-container">
                            <CharacterSheet 
                                character={selectedHero}
                                scrollToSection={scrollToSection}
                                onDidScroll={handleDidScroll}
                             />
                        </div>
                    </div>
                </div>
            );
        }
        
        if (gallery.length === 0) {
            return (
                <div className="gallery-empty-state">
                    <h2>La Galería está Vacía</h2>
                    <p>Forja a tu primer héroe en 'Inicio' para comenzar tu galería.</p>
                </div>
            );
        }
    
        return (
            <div className="gallery-container">
                <div className="gallery-grid">
                    {gallery.map((hero, index) => {
                        const heroSaga = sagas[hero.id];
                        let sagaStatus: { text: string; className: string } | null = null;
                        if (heroSaga) {
                            if (heroSaga.isComplete) {
                                sagaStatus = { text: 'Completada', className: 'status-completed' };
                            } else {
                                sagaStatus = { text: 'En Progreso', className: 'status-in-progress' };
                            }
                        }

                        return (
                           <GalleryCard
                                key={hero.id}
                                hero={hero}
                                sagaStatus={sagaStatus}
                                onClick={() => setSelectedHero(hero)}
                                index={index}
                           />
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <>
            {renderContent()}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title="Desterrar Héroe"
                message={`¿Estás seguro de que quieres desterrar a ${heroToDelete?.heroe} de la galería? Esta acción es irreversible y su crónica se perderá para siempre en los anales del tiempo.`}
            />
        </>
    );
};

export default GalleryView;