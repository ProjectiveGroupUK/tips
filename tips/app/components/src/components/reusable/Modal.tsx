// React
import { useEffect, useState } from "react";

// Framer motion
import { motion } from "framer-motion";

// CSS
import styles from "@/styles/processTable/modal.module.css";

interface PropsInterface {
    isOpen: boolean; // The modal component is always mounted but isOpen tells the component whether it should make itself visible or not
    onFadeOutBegin?: () => void; // Callback function which is called when the modal begins to fade out
    onFadeOutComplete?: () => void; // Callback function which is called when the modal has completed fading out and is now hidden
    noPadding?: boolean;
    children: React.ReactNode;
}

interface ModalDisplayPropsInterface {
    isVisible: boolean | undefined; // Keeps track of whether the modal is still actually visible (as opposed to isOpen prop which acts as an instruction to make itself visible or not)
    modalOpacityStyle: React.CSSProperties;
}

const fadeDuration = 300; // Duration of fade-in/fade-out effect in milliseconds (needs to match CSS transition duration)

export default function Modal({ isOpen, onFadeOutBegin, onFadeOutComplete, noPadding, children}: PropsInterface) {

    const [modalDisplayProps, setModalDisplayProps] = useState<ModalDisplayPropsInterface>({
        isVisible: undefined,
        modalOpacityStyle: { opacity: 0 }
    });

    useEffect(() => {
        switch(isOpen) {
            case true: // Modal should be visible
                handleOpenModal();
                break;

            case false: // Modal should be hidden (or start hiding)
                handleCloseModal();
                break;
        }
    }, [isOpen]);

    useEffect(() => { // Call onFadeOutComplete callback function when modal is no longer visible
        if(modalDisplayProps.isVisible === false) onFadeOutComplete?.();
    }, [modalDisplayProps.isVisible]);

    function handleOpenModal() {
        // Set opacity to 0, and set up an almost-immediate timeout which brings opacity to 1 so that fade effect takes place (rather than instantly appearing)
        setTimeout(() => {
            setModalDisplayProps((prev) => ({ ...prev, modalOpacityStyle: { opacity: 1 } }));
        }, 50);

        setModalDisplayProps({ 
            isVisible: true, 
            modalOpacityStyle: { opacity: 0 } 
        });
    }

    function handleCloseModal() {
        setModalDisplayProps((prev) => {
            if(!prev.isVisible) return { ...prev, modalOpacityStyle: { opacity: 0 } }; // If modal is already hidden, keep it hidden (and perhaps manually rewrite opacity to 0 even though it should already be 0)

            // Code continues here if modal is changing from visible to hidden
            onFadeOutBegin?.(); // Call callback notifying that fade-out effect is beginning

            // Wait for fade-out effect to finish before setting isVisible to false
            setTimeout(() => {
                setModalDisplayProps((prev) => ({ ...prev, isVisible: false }));
                onFadeOutComplete?.();
            }, fadeDuration);

            return { ...prev, modalOpacityStyle: { opacity: 0 } }; // Set opacity to 0 immediately so that the fade-out effect can begin
        });
        onFadeOutBegin?.();
    }

    if(!modalDisplayProps.isVisible) return <></>; // If modal is not visible, don't render anything

    return(
        <div 
            className={styles.backdrop}
            style={modalDisplayProps.modalOpacityStyle}
            onClick={handleCloseModal}
        >
            <motion.div layout className={`${styles.contentContainer} ${noPadding && styles.noPadding}`}>
                <div className={styles.content} onClick={(e) => e.stopPropagation()}>
                    { children }
                </div>
            </motion.div>
        </div>
    )
}