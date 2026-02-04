import React, { useEffect } from 'react';
import { Character } from '../types';

interface CharacterSheetProps {
    character: Character | null;
    scrollToSection?: string | null;
    onDidScroll?: () => void;
}

const sanitizeTitleForId = (title: string): string => {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const getVinculoClass = (tipo: string): string => {
    const lowerTipo = tipo.toLowerCase();
    if (['mentor', 'aliado', 'nakama', 'puro', 'familia', 'discípulo', 'restaurado'].some(term => lowerTipo.includes(term))) {
        return 'tipo-positivo';
    }
    if (['rival', 'competencia'].some(term => lowerTipo.includes(term))) {
        return 'tipo-neutral';
    }
    if (['tóxico', 'corrupto', 'antagonista', 'enemigo', 'caído'].some(term => lowerTipo.includes(term))) {
        return 'tipo-negativo';
    }
    return 'tipo-default';
};


const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, scrollToSection, onDidScroll }) => {
    
    useEffect(() => {
        if (scrollToSection && onDidScroll && character) {
            const sanitizedId = sanitizeTitleForId(scrollToSection);
            const element = document.querySelector(`[data-section-id='${sanitizedId}']`);

            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                if (element instanceof HTMLElement) {
                    element.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
                    setTimeout(() => {
                        element.style.backgroundColor = '';
                    }, 2500);
                }
            }
            onDidScroll();
        }
    }, [scrollToSection, onDidScroll, character]);


    if (!character) {
        return (
          <div className="character-sheet sheet-placeholder">
            <h2>El Archivo Espera</h2>
            <p>Escribe un nombre y presiona 'ELIGE A TU PERSONAJE BÍBLICO' para forjar su crónica.</p>
          </div>
        );
    }

    return (
        <article className="character-sheet" aria-labelledby="character-name">
            <header className="sheet-header">
                <h1 id="character-name" className="sheet-name">👑 {character.heroe}</h1>
                <p className="sheet-sub-header">{character.titulo}</p>
                {character.fraseCelebre && <blockquote className="sheet-quote">"{character.fraseCelebre}"</blockquote>}
                <p className="sheet-sub-header">🛡️ Rol: {character.rol}</p>
                <p className="sheet-sub-header">🏛️ Facción: {character.faccion}</p>
            </header>

            <section className="sheet-section">
                <h2 className="sheet-section-title">🧠 Atributos del "Alma" (Capa 3)</h2>
                <p>{character.atributosAlma.descripcion}</p>
                {character.atributosAlma.estadisticas.map(stat => (
                    <div key={stat.nombre} className="atributo-item">
                        <div className="atributo-header">
                            <span className="atributo-nombre">{stat.nombre}</span>
                            <span className="atributo-valor">{stat.valor}</span>
                        </div>
                        <p>{stat.descripcion}</p>
                    </div>
                ))}
            </section>
            
            <section className="sheet-section">
                <h2 className="sheet-section-title">💔 Debilidad del "Alma" (Corrupción)</h2>
                <p>{character.debilidadAlma.descripcion}</p>
            </section>
            
            <section className="sheet-section">
                <h2 className="sheet-section-title">⚔️ Árbol de Habilidades</h2>
                <div className="sheet-two-col-grid">
                    <div className="habilidad-col">
                        <h3 className="habilidad-title">🌳 TALENTOS (Técnica)</h3>
                        {character.habilidades.talentos.map(habilidad => (
                            <div key={habilidad.nombre} className="habilidad-item">
                                <p className="habilidad-name">{habilidad.nombre}</p>
                                <p>{habilidad.descripcion}</p>
                            </div>
                        ))}
                    </div>
                    <div className="habilidad-col">
                        <h3 className="habilidad-title">✨ DONES (Vínculo)</h3>
                        {character.habilidades.dones.map(habilidad => (
                            <div key={habilidad.nombre} className="habilidad-item">
                                <p className="habilidad-name">{habilidad.nombre}</p>
                                <p>{habilidad.descripcion}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {character.vinculosClave && (
                <section className="sheet-section">
                    <h2 className="sheet-section-title">🔗 Vínculos Clave (Capa 4)</h2>
                    <p>{character.vinculosClave.descripcion}</p>
                    {character.vinculosClave.vinculos.map(vinculo => (
                        <div key={vinculo.nombre} className="habilidad-item">
                            <p className="habilidad-name">{vinculo.nombre} <span className={`vinculo-tipo ${getVinculoClass(vinculo.tipo)}`}>{vinculo.tipo}</span></p>
                            <p>{vinculo.descripcion}</p>
                        </div>
                    ))}
                </section>
            )}
            
            <section className="sheet-section">
                <h2 className="sheet-section-title">🎬 {character.arcoDetallado.titulo}</h2>
                {character.arcoDetallado.secciones.map(seccion => (
                    <div 
                        key={seccion.titulo} 
                        className="arco-seccion"
                        data-section-id={sanitizeTitleForId(seccion.titulo)}
                    >
                        <h3 className="arco-seccion-titulo">{seccion.titulo}</h3>
                        <p className="arco-contenido">{seccion.contenido}</p>
                    </div>
                ))}
            </section>

        </article>
    );
};

export default CharacterSheet;