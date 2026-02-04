import React, { useState } from 'react';
import { CharacterWithImage } from '../types';
import CharacterSheet from './CharacterSheet';
import ImageGenerator from './ImageGenerator';
import LoadingSpinner from './LoadingSpinner';

interface GeneratorViewProps {
  character: CharacterWithImage | null;
  imageUrl: string | null;
  isLoading: boolean;
  isImageLoading: boolean;
  error: string | null;
  heroName: string;
  setHeroName: (name: string) => void;
  handleGenerate: () => void;
  handleStartSaga: (hero: CharacterWithImage) => void;
}

const GeneratorView: React.FC<GeneratorViewProps> = ({
  character,
  imageUrl,
  isLoading,
  isImageLoading,
  error,
  heroName,
  setHeroName,
  handleGenerate,
  handleStartSaga,
}) => {
    const isGenerating = isLoading || isImageLoading;
    const [isCopied, setIsCopied] = useState(false);

    const handleShare = () => {
      if (!character || isCopied) return;
  
      const shareText = `⚔️ ¡He forjado la crónica de ${character.heroe}, "${character.titulo}" en el Códice de Héroes de Épicos de la Fe! ⚔️\n\nDescubre su saga y crea la tuya aquí: ${window.location.href}`;
  
      navigator.clipboard.writeText(shareText).then(() => {
          setIsCopied(true);
          setTimeout(() => {
              setIsCopied(false);
          }, 2000);
      }).catch(err => {
          console.error('Failed to copy text: ', err);
      });
    };

    return (
        <div className="generator-view">
             <p className="generator-instructions">
              Introduce el nombre de un personaje bíblico para forjar su crónica y su retrato épico.
            </p>

            <div className="generator-controls">
                <input 
                  type="text"
                  className="hero-input"
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  placeholder='Ej: "David", "Sansón", "Ester"'
                  aria-label="Nombre del Héroe"
                  disabled={isGenerating}
                  onKeyUp={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                />
            </div>
            
            <div className="generator-buttons">
              <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="primary-button generator-button"
              >
                  {isLoading ? "FORJANDO CRÓNICA..." : isImageLoading ? "INVOCANDO VISIÓN..." : "ELIGE A TU PERSONAJE BÍBLICO"}
              </button>

              {character && imageUrl && !isGenerating && (
                <div className="generator-actions">
                    <button
                        onClick={handleShare}
                        className="secondary-button"
                        disabled={isCopied}
                    >
                        {isCopied ? '¡ENLACE COPIADO!' : 'COMPARTIR HÉROE'}
                    </button>
                    <button
                        onClick={() => handleStartSaga(character)}
                        className="secondary-button"
                    >
                       COMENZAR SAGA
                    </button>
                </div>
              )}
            </div>

            {error && <div className="error-message" role="alert"><p><strong>Error:</strong> {error}</p></div>}
            
            <div id="hero-display" className={`hero-display-grid ${!isLoading ? 'fade-in' : ''}`}>
                {isLoading ? <LoadingSpinner /> : (
                  <>
                    <div className="character-image-container">
                      <ImageGenerator 
                        imageUrl={imageUrl} 
                        characterName={character?.heroe ?? null}
                        isLoading={isImageLoading}
                      />
                    </div>
                    <div className="character-data-container">
                      <CharacterSheet character={character} />
                    </div>
                  </>
                )}
            </div>
        </div>
    );
}

export default GeneratorView;