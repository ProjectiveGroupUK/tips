// CSS
import styles from '@/styles/ProcessTable/StatusPill.module.css';

declare interface StatusPillPropsInterface {
    status: 'active' | 'inactive';
}

export default function StatusPill({ status }: StatusPillPropsInterface) {
    return (
        <div className={`${styles.parent} ${ status === 'active' ? styles.active : styles.inactive }`}>
            <p>{ status }</p>
        </div>
    )
}