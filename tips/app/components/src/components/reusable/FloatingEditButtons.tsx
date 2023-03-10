// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// Spinners
import { PuffLoader } from "react-spinners";

// CSS
import styles from "@/styles/FloatingEditButtons/FloatingEditButtons.module.css";

interface PropsInterface {
    type: 'create' | 'edit';
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    isSaving?: boolean;
    onCancel?: () => void;
    onSave?: () => void;
}

export default function FloatingEditButton({ type, isEditing, setIsEditing, isSaving, onCancel, onSave }: PropsInterface) {

    function handleCancel() {
        onCancel?.();
    }

    function handleSave() {
        onSave?.();
    }

    return(
        <div className={`${styles.editButtonContainer} ${isSaving && styles.savingInProgress}`}>

            {/* Edit (or cancel) button */}
            <motion.button
                layout
                className={type === 'create' ? styles.button_discard : (isEditing ? styles.button_cancel : styles.button_edit)}
                onClick={isEditing ? handleCancel : () => setIsEditing(true)}
                disabled={isSaving}
            >
                { type === 'create' ? 'Discard' : (isEditing ? 'Cancel' : 'Edit') }
            </motion.button>
            <AnimatePresence mode='popLayout'>

                {/* Save button */}
                { (isEditing || isSaving || type === 'create') && (
                    <motion.button
                        id="saveButton"
                        className={styles.button_save}
                        onClick={handleSave}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                    >

                        {/* Label */}
                        <label htmlFor="saveButton">{ type === 'create' ? 'Create' : 'Save' }</label>

                        {/* Saving in progress spinner */}
                        { isSaving && <PuffLoader size={20} color='var(--primary)' /> }
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}