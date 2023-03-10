// CSS
import styles from '@/styles/processTable/statusPill.module.css';

declare interface StatusPillPropsInterface {
    status: 'active' | 'inactive';
}

export default function StatusPill({ status }: StatusPillPropsInterface) {
    return (
        <div className={`${styles.parent} ${ status ? styles.active : styles.inactive }`}>
            <p>{ status }</p>
        </div>
    )
}