// React
import { useEffect, useState } from "react";

// CSS
import styles from "@/styles/modal.module.css";

interface PropsInterface {
    isOpen: boolean; // The modal component is always mounted but isOpen tells the component whether it should make itself visible or not
    closeModal: () => void;
    children: React.ReactNode;
}

interface ModalDisplayPropsInterface {
    isVisible: boolean; // Keeps track of whether the modal is still actually visible (as opposed to isOpen prop which acts as an instruction to make itself visible or not)
    modalOpacityStyle: React.CSSProperties;
}

const fadeDuration = 300; // Duration of fade-in/fade-out effect in milliseconds (needs to match CSS transition duration)

export default function Modal({ isOpen, closeModal, children}: PropsInterface) {

    const [modalDisplayProps, setModalDisplayProps] = useState<ModalDisplayPropsInterface>({
        isVisible: false,
        modalOpacityStyle: { opacity: 0 }
    });

    useEffect(() => {
        let timer: NodeJS.Timeout; // Keep track of setTimeout instances so that they can be cleared in cleanup function
        setModalDisplayProps((prev) => {
            switch(isOpen) {
                case true: // Modal should be visible

                    // Set opacity to 0, and set up an almost-immediate timeout which brings opacity to 1 so that fade effect takes place (rather than instantly appearing)
                    timer = setTimeout(() => {
                        setModalDisplayProps((prev) => ({ ...prev, modalOpacityStyle: { opacity: 1 } }));
                    }, 50);

                    return { 
                        isVisible: true, 
                        modalOpacityStyle: { opacity: 0 } 
                    };

                case false: // Modal should be hidden (or start hiding)
                    if(!prev.isVisible) return { ...prev, modalOpacityStyle: { opacity: 0 } }; // If modal is already hidden, keep it hidden (and perhaps manually rewrite opacity to 0 even though it should already be 0)

                    // Modal is changing from visible to hidden

                    // Wait for fade-out effect to finish before setting isVisible to false
                    timer = setTimeout(() => {
                        setModalDisplayProps((prev) => ({ ...prev, isVisible: false }));
                    }, fadeDuration);

                    return { ...prev, modalOpacityStyle: { opacity: 0 } }; // Set opacity to 0 immediately so that the fade-out effect can begin
            }
        })

        // Clean up timeout if component unmounts before fade-out effect finishes
        return () => {
            if(timer !== undefined) clearTimeout(timer);
        };
    }, [isOpen]);

    if(!modalDisplayProps.isVisible) return <></>; // If modal is not visible, don't render anything

    return(
        <div 
            className={styles.modal}
            style={modalDisplayProps.modalOpacityStyle}
            onClick={closeModal}
        >
            <div className={styles.content} onClick={(e) => e.stopPropagation()}>
                { children }
            </div>
        </div>
    )
}