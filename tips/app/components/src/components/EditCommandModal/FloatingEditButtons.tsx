// React
import { useState } from "react";
import { Dispatch, SetStateAction } from "react";

// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// CSS
import styles from "@/styles/editCommandModal/floatingEditButtons.module.css";

interface PropsInterface {
    isEditing: boolean;
    setIsEditing: Dispatch<SetStateAction<boolean>>;
}

export default function FloatingEditButton({ isEditing, setIsEditing }: PropsInterface) {
    return(
        <div className={styles.editButtonContainer}>

            <motion.button
                layout
                className={ isEditing ? styles.button_cancel : styles.button_edit}
                onClick={() => setIsEditing((prev) => !prev)}
            >
                { isEditing ? 'Cancel' : 'Edit' }
            </motion.button>
            <AnimatePresence mode='popLayout'>
                { isEditing && (
                    <motion.button
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