// React
import { useMemo, useState } from 'react';
import { ChangeEvent } from 'react';

// React-table
import { useTable, useFilters } from 'react-table';
import { Row, Column, Cell } from 'react-table';

// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// Contexts
import { useSharedData } from '@/components/reusable/contexts/SharedDataContext';

// Interfaces
import { CommandDataInterface } from "@/interfaces/Interfaces";
import { FilterCategoryInterface } from './EditCommandModal';

// CSS
import styles from '@/styles/processTable/editCommandsTable.module.css';

interface PropsInterface {
    filterCategories: FilterCategoryInterface[];
    filterText: string;
    isEditing: boolean;
}

type Data = object;

type CategoryToKeysMap = {
    [K in keyof CommandDataInterface]: FilterCategoryInterface['id'];
};

type EditCommandPropertyArgs = {
    event: ChangeEvent<HTMLInputElement>;
    propertyName: keyof CommandDataInterface;
    propertyValue: CommandDataInterface[keyof CommandDataInterface];
}

export default function EditCommandsTable({ filterCategories, filterText, isEditing }: PropsInterface) {

    const { selectedCommand } = useSharedData();
    const [editedCommandValues, setEditedCommandValues] = useState<CommandDataInterface>(selectedCommand!);

    const tableInstance = generateTableData({
        commandData: isEditing ? editedCommandValues : selectedCommand!,
        filterCategories,
        isEditing,
        editCommandProperty
    });

    const filteredRows = useMemo(() => { // Filter available rows based on filter categories and text
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

    function editCommandProperty({ propertyName, propertyValue }: EditCommandPropertyArgs) { // Function that updates the editedCommandValues state variable with new value for the specified property
        setEditedCommandValues((prevState) => ({
            ...prevState,
            [propertyName]: propertyValue
            }
        ));
    }

    return (
        <motion.table
            className={styles.table}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
        >
            <AnimatePresence>
                { filterCategories.map((category) => {
                    const filteredRowsForCategory = filteredRows.filter((row) => row.allCells[0].value === category.id);
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

function generateTableData({ commandData, filterCategories, isEditing, editCommandProperty }: {
    commandData: CommandDataInterface;
    filterCategories: FilterCategoryInterface[];
    isEditing: boolean;
    editCommandProperty: (args: EditCommandPropertyArgs) => void;
}) {
    const tableColumns = useMemo(() => [
        {
            Header: 'category_id',
            accessor: 'category_id',
        },
        {
            Header: 'Property Name',
            accessor: 'property_name',
            Cell: (cell: Cell) => renderCell(cell, isEditing)
        },
        {
            Header: 'Property Value',
            accessor: 'property_value',
            Cell: (cell: Cell) => renderCell(cell, isEditing)
        }
    ], [commandData, isEditing]);

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
        })), [commandData]);

    const tableInstance = useTable<Data>({
        columns: (tableColumns as Column<Object>[]),
        data: tableData,
        initialState: { hiddenColumns: ['category_id'] }
    }, useFilters);

    return tableInstance;

    function renderCell(cell: Cell, isEditing: boolean) {
        const columnId = cell.column.id as 'property_name' | 'property_value';
        switch(columnId) {
            case 'property_name':
                return <div>{cell.value}</div>

            case 'property_value':
                return (
                    <input
                        value={cell.value ?? ''}
                        onChange={(event) => (
                            editCommandProperty({ 
                                event,
                                propertyName: (cell.row.original as {property_name: string}).property_name as keyof CommandDataInterface, 
                                propertyValue: event.target.value
                            })
                        )}
                        placeholder='NULL'
                        className={!cell.value ? styles.emptyCell : ''}
                        disabled={!isEditing} 
                    />
                );
        }
    }
}