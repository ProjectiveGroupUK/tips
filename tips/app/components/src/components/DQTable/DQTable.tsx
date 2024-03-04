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
import { useDQTableData } from '@/contexts/DQTableDataContext';

// Interfaces
import { DQDataInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

// CSS
// import styles from '@/styles/ProcessTable/ProcessTable.module.css';
import styles from '@/styles/DQTable/dqTable.module.css';

// Components
import StatusPill from '@/components/DQTable/StatusPill';
import DQTargetsTable from './DQTargetsTable';

// Icons
import { CirclePlus, DotsVertical, Pencil, PencilPlus, ChevronsRight, ChevronsDown } from 'tabler-icons-react';

type Data = object;

export default function ProcessTable() {
    useEffect(() => { Streamlit.setFrameHeight(); }); // Update frame height on each re-render
    const { dqData, setDQTargetData, setEditedDQData } = useDQTableData();

    const tableInstance = generateTableData({ dqData: dqData, handleNewDQClick, handleNewDQTargetClick, handleEditDQClick });
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

    const [selectedDQId, setSelectedDQId] = useState<DQDataInterface['PROCESS_DQ_TEST_ID'] | null>(null);

    useEffect(() => { // Expand row when clicked
        rows.forEach((row) => row.toggleRowExpanded(row.id === selectedDQId?.toString()))
    }, [selectedDQId])

    function handleNewDQClick() {
        setEditedDQData({
            operation: {
                type: OperationType.CREATE
            },
            dqdata: {
                PROCESS_DQ_TEST_ID: 0, // Dummy value which will be replaced by Python script when running INSERT INTO query
                PROCESS_DQ_TEST_NAME: '',
                PROCESS_DQ_TEST_DESCRIPTION: '',
                PROCESS_DQ_TEST_QUERY_TEMPLATE: '',
                PROCESS_DQ_TEST_ERROR_MESSAGE: '',
                targets: [],
                ACTIVE: 'Y'
            },
            executionStatus: ExecutionStatus.NONE
        });
    }

    function handleNewDQTargetClick(rowId: DQDataInterface['PROCESS_DQ_TEST_ID']) {
        const dqdata = dqData.find((data) => data.PROCESS_DQ_TEST_ID === rowId)!;
        setDQTargetData({
            operation: {
                type: OperationType.CREATE
            },            
            dqdata: dqdata,
            dqtarget: {
                PROCESS_CMD_TGT_DQ_TEST_ID: 0,
                TGT_NAME: '',
                ATTRIBUTE_NAME: '',
                PROCESS_DQ_TEST_NAME: dqdata.PROCESS_DQ_TEST_NAME,
                ACCEPTED_VALUES: '',
                QUERY_BINDS: '',
                ERROR_AND_ABORT: false,
                ACTIVE: 'Y'
            },
            executionStatus: ExecutionStatus.NONE
        });
    }

    function handleEditDQClick(rowId: DQDataInterface['PROCESS_DQ_TEST_ID']) {
        const dqdata = dqData.find((data) => data.PROCESS_DQ_TEST_ID === rowId)!;
        setEditedDQData({
            operation: {
                type: OperationType.EDIT
            },
            dqdata: dqdata,
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
                        const isSelected = row.id === selectedDQId?.toString();
                        const expandedRowExistsAbove = rows.some((row, i) => i < index && row.isExpanded); // Used for styling purposes to determine colour of row (since :even and :odd selectors don't work with expanded rows the way I need them to)
                        const dynamicIndexIsEven = (index - (Number(expandedRowExistsAbove) * 2)) % 2 === 0;

                        return (
                            <Fragment key={row.id}>
                                <tr
                                    className={`${isSelected && styles.selected} ${dynamicIndexIsEven ? styles.dynamicIndex_even : styles.dynamicIndex_odd}`} // If row is expanded, add 'selected' class; and depending on dynamicIndex, add 'dynamicIndex-even' or 'dynamicIndex-odd' class
                                    onClick={() => { // When clicked, update expandedRowId state variable
                                        setSelectedDQId((prev) => prev === Number(row.id) ? null : Number(row.id)) // Deslect row if already selected, otherwise select row
                                    }}>
                                    {row.cells.map((cell) => {
                                        let renderedCell: React.ReactNode;
                                        if (cell.column.id === 'dq_id' && row.isExpanded) renderedCell = <ChevronsDown size={20} color='var(--primary)' />;
                                        else if (cell.column.id === 'dq_id' && !row.isExpanded) renderedCell = <ChevronsRight size={20} color='var(--primary)' />;
                                        else if (cell.column.id === 'dq_status') renderedCell = <StatusPill status={cell.value === 'Active' ? 'active' : 'inactive'} />;
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
                                                <DQTargetsTable selectedDQ={dqData.find((iteratedDQ) => iteratedDQ.PROCESS_DQ_TEST_ID === selectedDQId)!} />
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

function generateTableData({ dqData, handleNewDQClick, handleNewDQTargetClick, handleEditDQClick }: {
    dqData: DQDataInterface[];
    handleNewDQClick: () => void;
    handleNewDQTargetClick: (rowId: DQDataInterface['PROCESS_DQ_TEST_ID']) => void;
    handleEditDQClick: (rowId: DQDataInterface['PROCESS_DQ_TEST_ID']) => void;
}) {
    const tableColumns = useMemo(() => [
        {
            Header: '',
            accessor: 'dq_id'
        },
        {
            Header: 'Name',
            accessor: 'dq_name'
        },
        {
            Header: 'Description',
            accessor: 'dq_description'
        },
        {
            Header: 'Status',
            accessor: 'dq_status'
        },
        {
            Header: (
                <Tooltip label='Create new DQ Test' classNames={{ tooltip: styles.tooltip }} transitionProps={{ transition: 'scale' }}>
                    <button onClick={handleNewDQClick} className={styles.createDQButton}>
                        <CirclePlus width={20} />
                    </button>
                </Tooltip>
            ),
            accessor: 'actionsButtonColumn',
            Cell: (cell: Cell) => renderCell(cell)
        }
    ], [dqData]); // Setting dqData as dependency because otherwise if process gets updated, the handle click functions called in renderCell() would use outdated processData 

    const tableData = useMemo(() => dqData.map((data) => ({
        dq_id: data.PROCESS_DQ_TEST_ID,
        dq_name: data.PROCESS_DQ_TEST_NAME,
        dq_description: data.PROCESS_DQ_TEST_DESCRIPTION,
        dq_status: data.ACTIVE == 'Y' ? 'Active' : 'Inactive'
    })), [dqData]);

    const tableInstance = useTable<Data>({
        columns: tableColumns as Column<Object>[],
        data: tableData,
        getRowId: (row: any) => row.dq_id.toString()
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
                    <Menu.Item icon={<Pencil size={15} color='var(--primary)' />} onClick={() => handleEditDQClick(Number(cell.row.id))}>Edit DQ Test</Menu.Item>
                    <Menu.Item icon={<PencilPlus size={15} color='var(--primary)' />} onClick={() => handleNewDQTargetClick(Number(cell.row.id))}>Insert new Target</Menu.Item>
                </Menu.Dropdown>
            </Menu>
        )
    }
}