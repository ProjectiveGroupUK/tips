// React
import { useState, useMemo } from "react";

// React-table
import { useTable, useFilters } from 'react-table';
import { Row, Cell } from "react-table";

// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// Contexts
import { useSharedData } from "@/components/reusable/contexts/SharedDataContext";

// Components
import Modal from "@/components/reusable/Modal";
import FloatingEditButtons from "./FloatingEditButtons";

// Interfaces
import { CommandDataInterface } from "@/interfaces/Interfaces";

// CSS
import styles from "@/styles/processTable/editCommandModal.module.css";

// Icons
import { Search } from 'tabler-icons-react';

interface FilterCategoryInterface{
    id: string;
    label: string;
    active: boolean;
    propertyIds: Array<keyof CommandDataInterface>;
}

export default function EditCommandModal() {
    const { selectedProcess, selectedCommand, setSelectedCommandId } = useSharedData();
    const [filterCategories, setFilterCategories] = useState<FilterCategoryInterface[]>([
        { id: 'params', label: 'Parameters', active: false, propertyIds: ['CMD_TYPE', 'CMD_WHERE', 'CMD_BINDS'] },
        { id: 'io', label: 'Input & output', active: false, propertyIds: ['CMD_SRC', 'CMD_TGT'] },
        { id: 'merging', label: 'Merging', active: false, propertyIds: ['MERGE_ON_FIELDS', 'GENERATE_MERGE_MATCHED_CLAUSE', 'GENERATE_MERGE_NON_MATCHED_CLAUSE'] },
        { id: 'additional_fields_and_processing', label: 'Additional fields & processing', active: false, propertyIds: ['ADDITIONAL_FIELDS', 'TEMP_TABLE', 'CMD_PIVOT_BY', 'CMD_PIVOT_FIELD'] },
        { id: 'other', label: 'Other', active: false, propertyIds: ['REFRESH_TYPE', 'BUSINESS_KEY', 'DQ_TYPE', 'CMD_EXTERNAL_CALL', 'ACTIVE'] }
    ])
    const [filterText, setFilterText] = useState('');

    const tableInstance = generateTableData({
        commandData: selectedCommand ?? {} as CommandDataInterface,
        filterCategories
    });

    // Update tableInstance to correspond to filterCategories and filterText
    const filteredRows = useMemo(() => {
        return tableInstance.rows.filter((row) => {
            tableInstance.prepareRow(row);
            return (
                satisfiesCategoryFilter(row as Row<CommandDataInterface>) &&
                satisfiesTextFilter(row as Row<CommandDataInterface>)
            );
        });

        function satisfiesCategoryFilter(row: Row<CommandDataInterface>) {
            const activeFilterCategory = filterCategories.find((iteratedCategory) => iteratedCategory.active);
            return activeFilterCategory ? row.allCells[0].value === activeFilterCategory.id : true;
        }

        function satisfiesTextFilter(row: Row<CommandDataInterface>) {
            const propertyName = row.allCells[1].value as keyof CommandDataInterface;
            const propertyValue = row.allCells[2].value as string | null;
            return propertyName.toLowerCase().includes(filterText.toLowerCase()) || propertyValue?.toLowerCase().includes(filterText.toLowerCase());
        }
    }, [filterCategories, filterText, tableInstance.rows]) as Row<CommandDataInterface>[];

    function handleCategoryClick(selectedCategoryId: string) {
        setFilterCategories(filterCategories.map((iteratedCategory) => 
            iteratedCategory.id === selectedCategoryId ? 
                { ...iteratedCategory, active: !iteratedCategory.active } 
                : { ...iteratedCategory, active: false }
        ));
    }

    return(
        <Modal
            isOpen={selectedCommand !== null}
            onFadeOutComplete={() => setSelectedCommandId(null)}
            noPadding={true}
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1>Command {selectedCommand?.PROCESS_CMD_ID}</h1>
                        <h2>From the {selectedProcess?.name} process</h2>
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.headerRight} data-active-status={selectedCommand?.ACTIVE}>
                        {selectedCommand?.ACTIVE === 'Y' ? 'Active' : 'Inactive'}
                    </div>
                </div>
                <div className={styles.configContainer}>
                    <div className={styles.verticalBar} />

                    <div className={styles.configParent}>

                        {/* Header */}
                        <div className={styles.configHeader}>

                            {/* Search box */}
                            <div className={styles.searchBox}>
                                <Search size={15} strokeWidth={2} color={'black'} />
                                <input className={styles.searchInput} value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                            </div>

                            {/* Category selection */}
                            <div className={styles.categorySelector}>
                            { filterCategories.map((category) => (
                                <button 
                                    key={category.id}
                                    className={`${styles.categoryItem} ${category.active && styles.active}`}
                                    onClick={() => handleCategoryClick(category.id)}
                                >
                                    {category.label}
                                </button>
                            ))}
                            </div>
                        </div>

                        { /* Tables */}
                        <TableForCategory 
                            filteredRows={filteredRows} 
                            filterCategories={filterCategories}
                        />
                        
                    </div>
                </div>
            </div>

            <FloatingEditButtons />
        </Modal>
    );
}

type Data = object;

type CategoryToKeysMap = {
    [K in keyof CommandDataInterface]: string;
};

function TableForCategory({ filteredRows: rows, filterCategories }: {
    filteredRows: Row<CommandDataInterface>[];
    filterCategories: FilterCategoryInterface[];
}) {
    return (
        <motion.table
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
        >
            <AnimatePresence>
                { filterCategories.map((category) => {
                    const filteredRowsForCategory = rows.filter((row) => row.allCells[0].value === category.id);
                    return filteredRowsForCategory.length > 0 ? ( // Only render the category if there are rows within it
                        <motion.tbody
                            key={category.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                        >

                            {/* Category header */}
                            <tr><td colSpan={100} className={styles.categoryLabel}><div>{category.label}</div></td></tr>

                            {/* Data rows for category */}
                            { filteredRowsForCategory.map((row) => (
                                <tr {...row.getRowProps()}>
                                    { row.cells.map((cell) => {
                                        return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                    })}
                                </tr>
                            ))}
                        </motion.tbody>
                    )
                    : null; // Don't return the category at all if there are no rows within it
                })}
            </AnimatePresence>
        </motion.table>
    )
}

function generateTableData({ commandData, filterCategories }: {
    commandData: CommandDataInterface;
    filterCategories: FilterCategoryInterface[];
}) {
    const tableColumns = useMemo(() => [
        {
            Header: 'category_id',
            accessor: 'category_id',
        },
        {
            Header: 'Property Name',
            accessor: 'property_name',
            Cell: renderCell
        },
        {
            Header: 'Property Value',
            accessor: 'property_value',
            Cell: renderCell
        }
    ], []);

    // Create a dictionary where there's one key for each property ID, and the value is the category ID (e.g., { CMD_TYPE: 'params', CMD_WHERE: 'params', CMD_SRC: 'io' ... })
    const categoryToKeysMap: CategoryToKeysMap = filterCategories.reduce((categoryToKeysMap, {id: categoryId, propertyIds}) => {
        const categoryProperties = propertyIds.reduce((categoryProperties, propertyId) => ({
            ...categoryProperties,
            [propertyId]: categoryId
        }), {})
        return { ...categoryToKeysMap, ...categoryProperties };
    }, {} as CategoryToKeysMap);

    const tableData = useMemo(() => Object.entries(commandData)
        .filter(([propertyKey]) => propertyKey in categoryToKeysMap) // Filter out properties that don't have a category (e.g., 'PROCESS_CMD_ID')
        .map(([propertyKey, propertyValue]) => ({ // Map the property key/value pairs to the table data format
            category_id: categoryToKeysMap[propertyKey as keyof CommandDataInterface],
            property_name: propertyKey,
            property_value: propertyValue
        })), []);

    const tableInstance = useTable<Data>({
        columns: tableColumns,
        data: tableData,
        initialState: { hiddenColumns: ['category_id'] }
    }, useFilters);

    return tableInstance;

    function renderCell(cell: any) {
        const isEmptyString = cell.value === '';
        return isEmptyString ?
            <span className={styles.emptyCell}>EMPTY</span> // If empty string, return 'EMPTY'
            : cell.value ?? <span className={styles.emptyCell}>NULL</span>; // Return cell value, or if undefined, return 'NULL'
    }
}