// React
import { Fragment, useEffect, useMemo, useState } from 'react';

// StreamLit
import { Streamlit } from 'streamlit-component-lib';

// React-table
import { useTable, useExpanded } from 'react-table';
import { Column, Cell } from 'react-table';

// Mantine
import { Menu } from '@mantine/core';

// Contexts
import { useProcessTableData } from '@/components/reusable/contexts/ProcessTableDataContext';

// Interfaces
import { ProcessDataInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus } from '@/enums/enums';

// CSS
import styles from '@/styles/processTable/processTable.module.css';

// Components
import StatusPill from '@/components/ProcessTable/jsx/StatusPill';
import ProcessCommandsTable from './ProcessCommandsTable';

// Icons
import { DotsVertical, Pencil, PencilPlus } from 'tabler-icons-react';

type Data = object;

export default function ProcessTable() {
    useEffect(() => { Streamlit.setFrameHeight(); }); // Update frame height on each re-render
    const { processData, setCreateCommand } = useProcessTableData();

    const tableInstance = generateTableData({ processData: processData, handleNewCommandClick: handleNewCommandClick });
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

    const [selectedProcessId, setSelectedProcessId] = useState<ProcessDataInterface[0]['id'] | null>(null);

    useEffect(() => { // Expand row when clicked
        rows.forEach((row) => row.toggleRowExpanded(row.id === selectedProcessId?.toString()))
    }, [selectedProcessId])

    function handleNewCommandClick(rowId: ProcessDataInterface[0]['id']) {
        const process = processData.find((process) => process.id === rowId)!;
        setCreateCommand({
            data: {
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
            process: process,
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
                                        { column.render('Header') }
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
                                { row.cells.map(cell => {
                                    let renderedCell: React.ReactNode;
                                    if(cell.column.id === 'process_status') renderedCell = <StatusPill status={cell.value} />;
                                    else renderedCell = cell.render('Cell');
                                    return (
                                        <td {...cell.getCellProps()}>
                                            { renderedCell }
                                        </td>
                                    )
                                })}
                            </tr>
                            { row.isExpanded && 
                                <tr className={`${styles.rowSubComponent} ${dynamicIndexIsEven ? styles.dynamicIndex_even : styles.dynamicIndex_odd}`}>
                                    <td colSpan={100}> {/* Should be equal to or greater than number of columns in table to span across all columns */}
                                        <div>
                                            <ProcessCommandsTable selectedProcess={processData.find((iteratedProcess) => iteratedProcess.id === selectedProcessId)!} />
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
                    { /* Footer */ }
                </td>
                </tr>
            </tfoot>
        </table>
    );
}

function generateTableData({ processData, handleNewCommandClick }: {
    processData: ProcessDataInterface;
    handleNewCommandClick: (rowId: ProcessDataInterface[0]['id']) => void;
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
            accessor: 'actionsButtonColumn',
            Cell: (cell: Cell) => renderCell(cell)
        }
    ], []);

    const tableData = useMemo(() => processData.map((process) => ({
        process_id: process.id,
        process_name: process.name,
        process_description: process.description,
        process_status: process.status
    })), []);

    const tableInstance = useTable<Data>({
        columns: (tableColumns as Column<Object>[]),
        data: tableData,
        getRowId: (row: any) => (row.process_id.toString())
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
                    <Menu.Item icon={<Pencil size={15} color='var(--primary)' />}>Edit process</Menu.Item>
                    <Menu.Item icon={<PencilPlus size={15} color='var(--primary)' />} onClick={() => handleNewCommandClick(Number(cell.row.id))}>Insert new command</Menu.Item>
                </Menu.Dropdown>
            </Menu>   
        )
    }
}