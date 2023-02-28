// React
import { useState, useEffect } from "react";

// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// CSS
import styles from "@/styles/editCommandModal/floatingEditButtons.module.css";

interface PropsInterface {
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    onCancel?: () => void;
    onSave?: () => void;
    completionConfirmed?: boolean; // Feedback from component which informs whether the save action was resolved (regardless of success)
}

export default function FloatingEditButton({ isEditing, setIsEditing, onCancel, onSave, completionConfirmed }: PropsInterface) {

    const [processing, setProcessing] = useState(false);

    useEffect(() => { if(processing && completionConfirmed) setProcessing(false); }, [processing, completionConfirmed])

    function handleCancel() {
        setIsEditing(false);
        onCancel?.();
    }

    function handleSave() {
        setIsEditing(false);
        setProcessing(true);
        onSave?.();
    }

    return(
        <div className={styles.editButtonContainer}>

            <motion.button
                layout
                className={`${isEditing ? styles.button_cancel : styles.button_edit} ${processing && 'processing'}`}
                onClick={isEditing ? handleCancel : () => setIsEditing(true)}
            >
                { isEditing ? 'Cancel' : 'Edit' }
            </motion.button>
            <AnimatePresence mode='popLayout'>
                { isEditing && (
                    <motion.button
                        onClick={handleSave}
                        layout
                        className={styles.button_save}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                    >
                        Save
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}