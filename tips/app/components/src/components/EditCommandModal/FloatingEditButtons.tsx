// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// Spinners
import { PuffLoader } from "react-spinners";

// CSS
import styles from "@/styles/editCommandModal/floatingEditButtons.module.css";

interface PropsInterface {
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    isSaving?: boolean;
    onCancel?: () => void;
    onSave?: () => void;
}

export default function FloatingEditButton({ isEditing, setIsEditing, isSaving, onCancel, onSave }: PropsInterface) {

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
                className={isEditing ? styles.button_cancel : styles.button_edit}
                onClick={isEditing ? handleCancel : () => setIsEditing(true)}
                disabled={isSaving}
            >
                { isEditing ? 'Cancel' : 'Edit' }
            </motion.button>
            <AnimatePresence mode='popLayout'>

                {/* Save button */}
                { (isEditing || isSaving) && (
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
                        <label htmlFor="saveButton">Save</label>

                        {/* Saving in progress spinner */}
                        { isSaving && <PuffLoader size={20} color='var(--primary)' /> }
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}