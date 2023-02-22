// React
import { useState } from "react";

// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// CSS
import styles from "@/styles/editCommandModal/floatingEditButtons.module.css";

export default function FloatingEditButton() {
    const [editing, setEditing] = useState(false);

    return(
        <div className={styles.editButtonContainer}>

            <motion.button
                layout
                className={ editing ? styles.button_cancel : styles.button_edit}
                onClick={() => setEditing((prev) => !prev)}
            >
                { editing ? 'Cancel' : 'Edit' }
            </motion.button>
            <AnimatePresence mode='popLayout'>
                { editing && (
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