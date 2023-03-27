// React
import { Fragment, useEffect, useMemo, useState } from 'react';

// StreamLit
import { Streamlit } from 'streamlit-component-lib';

// React-table
import { useTable, useExpanded } from 'react-table';
import { Column, Cell } from 'react-table';

// Mantine
import { Menu, Tooltip } from '@mantine/core';

// Contexts
import { useProcessTableData } from '@/contexts/ProcessTableDataContext';

// Interfaces
import { ProcessDataInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

// CSS
import styles from '@/styles/ProcessTable/ProcessTable.module.css';

// Components
import StatusPill from '@/components/ProcessTable/StatusPill';
import ProcessCommandsTable from './ProcessCommandsTable';

// Icons
import { CirclePlus, DotsVertical, Pencil, PencilPlus, Run } from 'tabler-icons-react';

type Data = object;

export default function ProcessTable() {
    useEffect(() => { Streamlit.setFrameHeight(); }); // Update frame height on each re-render
    const { processData, setCommand, setEditedProcess } = useProcessTableData();

    const tableInstance = generateTableData({ processData: processData, handleNewProcessClick, handleNewCommandClick, handleEditProcessClick, handleRunProcessClick });
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

    const [selectedProcessId, setSelectedProcessId] = useState<ProcessDataInterface['PROCESS_ID'] | null>(null);

    useEffect(() => { // Expand row when clicked
        rows.forEach((row) => row.toggleRowExpanded(row.id === selectedProcessId?.toString()))
    }, [selectedProcessId])

    function handleNewProcessClick() {
        setEditedProcess({
            operation: {
                type: OperationType.CREATE
            },
            process: {
                PROCESS_ID: 0, // Dummy value which will be replaced by Python script when running INSERT INTO query
                PROCESS_NAME: '',
                PROCESS_DESCRIPTION: '',
                steps: [],
                ACTIVE: 'Y',
                BIND_VARS: null,
                EXECUTE_FLAG: 'Y'
            },
            executionStatus: ExecutionStatus.NONE
        });
    }

    function handleNewCommandClick(rowId: ProcessDataInterface['PROCESS_ID']) {
        const process = processData.find((process) => process.PROCESS_ID === rowId)!;
        setCommand({
            operation: {
                type: OperationType.CREATE
            },
            process: process,
            command: {
                PROCESS_CMD_ID: 0, // Dummy value which will be replaced by Python script when running INSERT INTO query
                CMD_TYPE: 'APPEND',
                CMD_SRC: null,
                CMD_TGT: '',
                CMD_WHERE: null,
                CMD_BINDS: null,
                REFRESH_TYPE: null,
                BUSINESS_KEY: null,
                MERGE_ON_FIELDS: null,
                GENERATE_MERGE_MATCHED_CLAUSE: null,
                GENERATE_MERGE_NON_MATCHED_CLAUSE: null,
                ADDITIONAL_FIELDS: null,
                TEMP_TABLE: null,
                CMD_PIVOT_BY: null,
                CMD_PIVOT_FIELD: null,
                DQ_TYPE: null,
                CMD_EXTERNAL_CALL: null,
                ACTIVE: 'Y'
            },
            executionStatus: ExecutionStatus.NONE
        });
    }

    function handleEditProcessClick(rowId: ProcessDataInterface['PROCESS_ID']) {
        const process = processData.find((process) => process.PROCESS_ID === rowId)!;
        setEditedProcess({
            operation: {
                type: OperationType.EDIT
            },
            process: process,
            executionStatus: ExecutionStatus.NONE
        });
    }

    function handleRunProcessClick(rowId: ProcessDataInterface['PROCESS_ID']) {
        const process = processData.find((process) => process.PROCESS_ID === rowId)!;
        setEditedProcess({
            operation: {
                type: OperationType.RUN
            },
            process: {
                PROCESS_ID: process.PROCESS_ID,
                PROCESS_NAME: process.PROCESS_NAME,
                PROCESS_DESCRIPTION: process.PROCESS_DESCRIPTION,
                steps: [],
                ACTIVE: process.ACTIVE,
                BIND_VARS: null,
                EXECUTE_FLAG: 'Y'
            },
            executionStatus: ExecutionStatus.NONE
        });
    }

    return (
        <table {...getTableProps()} className={styles.table}>
            <thead>
                {
                    headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {
                                headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps()}>
                                        {column.render('Header')}
                                    </th>
                                ))}
                        </tr>
                    ))}
            </thead>

            <tbody {...getTableBodyProps()}>
                {
                    rows.map((row, index) => {
                        prepareRow(row)
                        const isSelected = row.id === selectedProcessId?.toString();
                        const expandedRowExistsAbove = rows.some((row, i) => i < index && row.isExpanded); // Used for styling purposes to determine colour of row (since :even and :odd selectors don't work with expanded rows the way I need them to)
                        const dynamicIndexIsEven = (index - (Number(expandedRowExistsAbove) * 2)) % 2 === 0;

                        return (
                            <Fragment key={row.id}>
                                <tr
                                    className={`${isSelected && styles.selected} ${dynamicIndexIsEven ? styles.dynamicIndex_even : styles.dynamicIndex_odd}`} // If row is expanded, add 'selected' class; and depending on dynamicIndex, add 'dynamicIndex-even' or 'dynamicIndex-odd' class
                                    onClick={() => { // When clicked, update expandedRowId state variable
                                        setSelectedProcessId((prev) => prev === Number(row.id) ? null : Number(row.id)) // Deslect row if already selected, otherwise select row
                                    }}>
                                    {row.cells.map(cell => {
                                        let renderedCell: React.ReactNode;
                                        if (cell.column.id === 'process_status') renderedCell = <StatusPill status={cell.value} />;
                                        else renderedCell = cell.render('Cell');
                                        return (
                                            <td {...cell.getCellProps()}>
                                                {renderedCell}
                                            </td>
                                        )
                                    })}
                                </tr>
                                {row.isExpanded &&
                                    <tr className={`${styles.rowSubComponent} ${dynamicIndexIsEven ? styles.dynamicIndex_even : styles.dynamicIndex_odd}`}>
                                        <td colSpan={100}> {/* Should be equal to or greater than number of columns in table to span across all columns */}
                                            <div>
                                                <ProcessCommandsTable selectedProcess={processData.find((iteratedProcess) => iteratedProcess.PROCESS_ID === selectedProcessId)!} />
                                            </div>
                                        </td>
                                    </tr>
                                }
                            </Fragment>
                        )
                    })
                }
            </tbody>

            <tfoot>
                <tr>
                    <td>
                        { /* Footer */}
                    </td>
                </tr>
            </tfoot>
        </table>
    );
}

function generateTableData({ processData, handleNewProcessClick, handleNewCommandClick, handleEditProcessClick, handleRunProcessClick }: {
    processData: ProcessDataInterface[];
    handleNewProcessClick: () => void;
    handleNewCommandClick: (rowId: ProcessDataInterface['PROCESS_ID']) => void;
    handleEditProcessClick: (rowId: ProcessDataInterface['PROCESS_ID']) => void;
    handleRunProcessClick: (rowId: ProcessDataInterface['PROCESS_ID']) => void;
}) {
    const tableColumns = useMemo(() => [
        {
            Header: 'Id',
            accessor: 'process_id'
        },
        {
            Header: 'Name',
            accessor: 'process_name'
        },
        {
            Header: 'Description',
            accessor: 'process_description'
        },
        {
            Header: 'Status',
            accessor: 'process_status'
        },
        {
            Header: (
                <Tooltip label='Create new process' classNames={{ tooltip: styles.tooltip }} transitionProps={{ transition: 'scale' }}>
                    <button onClick={handleNewProcessClick} className={styles.createProcessButton}>
                        <CirclePlus width={20} />
                    </button>
                </Tooltip>
            ),
            accessor: 'actionsButtonColumn',
            Cell: (cell: Cell) => renderCell(cell)
        }
    ], [processData]); // Setting processData as dependency because otherwise if process gets updated, the handle click functions called in renderCell() would use outdated processData 

    const tableData = useMemo(() => processData.map((process) => ({
        process_id: process.PROCESS_ID,
        process_name: process.PROCESS_NAME,
        process_description: process.PROCESS_DESCRIPTION,
        process_status: process.ACTIVE == 'Y' ? 'Active' : 'Inactive'
    })), [processData]);

    const tableInstance = useTable<Data>({
        columns: tableColumns as Column<Object>[],
        data: tableData,
        getRowId: (row: any) => row.process_id.toString()
    }, useExpanded);

    return tableInstance;

    function renderCell(cell: Cell) {
        return (
            <Menu>
                <Menu.Target>
                    <button onClick={(event) => event.stopPropagation()} className={styles.actionsButton}>
                        <DotsVertical size={20} />
                    </button>
                </Menu.Target>
                <Menu.Dropdown onClick={(event) => event?.stopPropagation()}>
                    <Menu.Item icon={<Pencil size={15} color='var(--primary)' />} onClick={() => handleEditProcessClick(Number(cell.row.id))}>Edit process</Menu.Item>
                    <Menu.Item icon={<PencilPlus size={15} color='var(--primary)' />} onClick={() => handleNewCommandClick(Number(cell.row.id))}>Insert new command</Menu.Item>
                    <Menu.Item icon={<Run size={15} color='var(--primary)' />} onClick={() => handleRunProcessClick(Number(cell.row.id))}>Run Process</Menu.Item>
                </Menu.Dropdown>
            </Menu>
        )
    }
}