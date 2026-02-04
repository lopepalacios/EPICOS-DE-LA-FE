import React, { useState, useEffect } from 'react';

interface ImageGeneratorProps {
    imageUrl: string | null;
    characterName: string | null;
    isLoading: boolean;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ imageUrl, characterName, isLoading }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
        setIsImageLoaded(false);
    }, [imageUrl]);

    return (
        <div className="image-display-container">
            {isLoading ? (
                <div className="image-placeholder image-placeholder-loading">
                    <p>Invocando visión...</p>
                </div>
            ) : imageUrl ? (
                <img 
                    src={imageUrl} 
                    alt={`Retrato de ${characterName}`} 
                    className={`image-display-img ${isImageLoaded ? 'image-loaded' : ''}`}
                    onLoad={() => setIsImageLoaded(true)}
                />
            ) : (
                <div className="image-placeholder">
                    <p>El alma espera manifestarse...</p>
                    <small style={{marginTop: '1rem', color: '#444'}}>Genera una ficha para poder crear su imagen.</small>
                </div>
            )}
        </div>
    );
};

export default ImageGenerator;