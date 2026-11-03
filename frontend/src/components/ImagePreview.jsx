import { useState } from "react";

function ImagePreview({ src, alt = "Report image", className = "" }) {
    const [open, setOpen] = useState(false);
    if (!src) return null;
    return (
        <>
            <button type="button" className="image-preview-trigger" onClick={() => setOpen(true)} aria-label={`Enlarge ${alt}`}>
                <img src={src} alt={alt} className={className} onError={event => { event.currentTarget.style.display = "none"; }} />
                <span>⌕ Enlarge</span>
            </button>
            {open && <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
                <button type="button" className="image-lightbox-close" onClick={() => setOpen(false)} aria-label="Close image preview">×</button>
                <img src={src} alt={alt} onClick={event => event.stopPropagation()} />
                <p>{alt}</p>
            </div>}
        </>
    );
}
export default ImagePreview;
