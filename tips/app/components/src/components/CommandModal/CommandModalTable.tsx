// React
import { useEffect, useMemo, useRef } from 'react';

// React-table
import { useTable, useFilters } from 'react-table';
import { Row, Column, Cell } from 'react-table';

// Contexts
import { useCommandModalData } from '@/contexts/CommandModalDataContext';

// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// Spinners
import { PulseLoader } from 'react-spinners';

// Interfaces
import { CommandDataInterface } from "@/interfaces/Interfaces";
import { FilterCategoryInterface } from './CommandModal';

// Enums
import { ExecutionStatus } from '@/enums/enums';

// CSS
import styles from '@/styles/CommandModal/CommandModalTable.module.css';

interface PropsInterface {
    selectedCommand: Partial<CommandDataInterface>;
    editedCommandValues: Partial<CommandDataInterface>;
    setEditedCommandValues: React.Dispatch<React.SetStateAction<Partial<CommandDataInterface>>>;
    filterCategories: FilterCategoryInterface[];
    filterText: string;
    isEditing: boolean;
    isProcessing: boolean;
}

type Data = object;

type CategoryToKeysMap = {
    [K in keyof CommandDataInterface]: FilterCategoryInterface['id'];
};

type EditCommandPropertyArgs = {
    propertyName: keyof CommandDataInterface;
    propertyValue: CommandDataInterface[keyof CommandDataInterface];
}

export default function CommandModalTable({ selectedCommand, editedCommandValues, setEditedCommandValues, filterCategories, filterText, isEditing, isProcessing }: PropsInterface) {

    const tableInstance = generateTableData({
        commandData: isEditing ? editedCommandValues : selectedCommand!,
        filterCategories,
        isEditing,
        isProcessing,
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

type InputRefs = {
    [K in keyof CommandDataInterface]: {
        ref?: HTMLInputElement | null;
        isActive?: boolean;
        caretPosition?: number | null;
    };
}

function generateTableData({ commandData, filterCategories, isEditing, isProcessing, editCommandProperty }: {
    commandData: Partial<CommandDataInterface>;
    filterCategories: FilterCategoryInterface[];
    isEditing: boolean;
    isProcessing: boolean;
    editCommandProperty: (args: EditCommandPropertyArgs) => void;
}) {

    const { command } = useCommandModalData();
    const inputRefs = useRef({} as InputRefs);

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
    ], [command, commandData, isEditing]);

    // Create a dictionary where there's one key for each property ID, and the value is the category ID (e.g., { CMD_TYPE: 'params', CMD_WHERE: 'params', CMD_SRC: 'io' ... })
    const categoryToKeysMap: CategoryToKeysMap = filterCategories.reduce((categoryToKeysMap, {id: categoryId, propertyIds}) => {
        const categoryProperties = propertyIds.reduce((accumulator, propertyId) => ({
            ...accumulator,
            [propertyId]: categoryId
        }), {});
        return { ...categoryToKeysMap, ...categoryProperties };
    }, {} as CategoryToKeysMap);

    const tableData = useMemo(() => (
        Object.entries(commandData)
            .filter(([propertyKey]) => propertyKey in categoryToKeysMap) // Filter out properties that don't have a category (e.g., 'PROCESS_CMD_ID')
            .map(([propertyKey, propertyValue]) => ({ // Map the property key/value pairs to the table data format
                category_id: categoryToKeysMap[propertyKey as keyof CommandDataInterface],
                property_name: propertyKey,
                property_value: propertyValue
            }))
    ), [commandData, command]);

    const tableInstance = useTable<Data>({
        columns: (tableColumns as Column<Object>[]),
        data: tableData,
        initialState: { hiddenColumns: ['category_id'] },
        getRowId: (row) => (row as { property_name: keyof CommandDataInterface }).property_name
    }, useFilters);
    
    useEffect(() => { // Re-focus input element if change in command data resulted in lost focus despite user still intending to edit
        returnFocusToActiveInput();
    }, [commandData])

    return tableInstance;

    function renderCell(cell: Cell, isEditing: boolean) {
        const columnId = cell.column.id as 'property_name' | 'property_value';
        const propertyName = (cell.row.original as {property_name: string}).property_name as keyof CommandDataInterface
        switch(columnId) {
            case 'property_name':
                return <div>{cell.value}</div>

            case 'property_value':
                const originalCommand = command?.command;
                const savingEditedValue = command?.executionStatus === ExecutionStatus.RUNNING && command.command?.[propertyName] !== originalCommand?.[propertyName];
                const cellValue = savingEditedValue ? command!.command?.[propertyName] : cell.value;
                const placeholder = cellValue === null ? 'NULL' : 'Empty String';

                return (
                    <div className={`${styles.inputContainer} ${savingEditedValue && styles.savingInProgress}`}>

                        {/* Invisible text element used to expand the input element to the width of the text */}
                        <div>{(cellValue && cellValue.length) ? cellValue : placeholder}</div> 

                        {/* Input element */}
                        <input
                            key={propertyName}
                            ref={(ref) => captureRef(ref, propertyName)}
                            value={cellValue ?? ''}
                            onChange={(event) => handleInputChange(event, propertyName)}
                            onBlur={() => handleBlur(propertyName)}
                            placeholder={placeholder}
                            className={!cell.value ? styles.emptyCell : ''}
                            disabled={!isEditing || isProcessing}
                        />

                        <AnimatePresence>

                            {/* Spinner to indicate that the edited value is being saved (opacity is set to 0 when saving is not in progress) */}
                            { savingEditedValue && (
                                <motion.div
                                    key='savingIndicator'
                                    className={styles.savingIndicator}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <PulseLoader size={5} color='var(--primary)' />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Button to switch value type between empty string and null (if field isn't populated) */}
                        { isEditing && !savingEditedValue && !cell.value && (
                            <button
                                key='switchValueTypeButton'
                                id='switchValueTypeButton'
                                className={styles.switchValueTypeButton}
                                onClick={() => editCommandProperty({ propertyName, propertyValue: cellValue === null ? '' : null })}
                            >
                                <label htmlFor='switchValueTypeButton'>
                                    { cellValue === null ? 'Set empty string' : 'Set NULL' }
                                </label>
                            </button>
                        )}
                    </div>
                );
        }
    }

    function handleInputChange(event: React.ChangeEvent<HTMLInputElement>, propertyName: keyof CommandDataInterface) { // Update inputRefs state variable to reflect latest input value and caret position, and update editedCommandValues state variable with new value for the specified property

        // Set isActive attribute within inputRefs state variable to true since input is focused
        inputRefs.current[propertyName] = {
            ...inputRefs.current[propertyName],
            isActive: true
        };

        // Update caret position within inputRefs state variable
        inputRefs.current[propertyName] = {
            ...inputRefs.current[propertyName],
            caretPosition: event.target.selectionStart!
        };

        // Update the editedCommandValues state variable with the new value for the specified property
        const propertyValue = event.target.value || null;
        editCommandProperty({ 
            propertyName, 
            propertyValue: event.target.value
        })
    }

    function handleBlur(propertyName: keyof CommandDataInterface) { // Update isActive attribute within inputRefs state variable to false when an input loses focus
        inputRefs.current[propertyName] = {
            ...inputRefs.current[propertyName],
            isActive: false
        };
    }

    function captureRef(ref: HTMLInputElement | null, propertyName: keyof CommandDataInterface) { // Assign the input element's ref to the inputRefs state variable for the specified property
        inputRefs.current[propertyName] = {
            ...inputRefs.current[propertyName],
            ref
        };
    }

    function returnFocusToActiveInput() { // Return focus to the input element that was active prior to unintentionally losing focus (due to re-render cause by change in commandData)
        const activeInputRef = Object.entries(inputRefs.current).find(([, { isActive }]) => isActive);
        if(activeInputRef) {
            const [, { ref, caretPosition }] = activeInputRef;
            if(ref) {
                ref.focus(); // Focus input element
                if(caretPosition) ref.setSelectionRange(caretPosition, caretPosition); // Put caret back to where it was prior to losing focus
            }
        }
    }
}