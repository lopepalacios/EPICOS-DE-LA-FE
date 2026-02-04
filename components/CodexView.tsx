import React from 'react';
import { loreData } from '../data/loreData';

const CodexView: React.FC = () => {
    return (
        <div className="codex-view">
            {loreData.map((entry, index) => (
                <article 
                    key={index} 
                    style={{ animationDelay: `${index * 0.1}s` }}
                    className="codex-entry stagger-in"
                >
                    <h2 className="codex-title">{entry.titulo}</h2>
                    <p className="codex-content">{entry.contenido}</p>
                </article>
            ))}
        </div>
    );
};

export default CodexView;
