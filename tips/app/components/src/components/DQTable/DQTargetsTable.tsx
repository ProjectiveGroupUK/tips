// React
import { useMemo } from 'react';

// React-table
import { useTable } from 'react-table';

// Mantine
import { Tooltip } from '@mantine/core';

// Contexts
import { useDQTableData } from '@/contexts/DQTableDataContext';

// Interfaces
import { DQDataInterface, DQTargetDataInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

// CSS
import styles from '@/styles/DQTable/DQTargetsTable.module.css';

interface PropsInterface {
    targets: DQDataInterface['targets'];
}

type Data = object;

export default function DQTargetsTable({ selectedDQ }: {
    selectedDQ: DQDataInterface;
}) {
    const { dqTargetData, setDQTargetData } = useDQTableData();
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = generateTableData({ targets: selectedDQ?.targets ?? [] });

    return (
        <table {...getTableProps()} className={styles.table}>
            <thead>
                {
                    headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {
                                headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps()}>
                                        <div>{column.render('Header')}</div>
                                    </th>
                                ))}
                        </tr>
                    ))}
            </thead>

            <tbody {...getTableBodyProps()}>
                {
                    rows.map((row) => {
                        prepareRow(row);
                        return (
                            <tr
                                key={row.id}
                                onClick={() => { // When clicked, update expandedRowId state variable
                                    setDQTargetData({
                                        operation: {
                                            type: OperationType.EDIT
                                        },
                                        dqdata: selectedDQ,
                                        dqtarget: selectedDQ.targets.find((iteratedDQTarget) => iteratedDQTarget.PROCESS_CMD_TGT_DQ_TEST_ID === Number(row.id))!,
                                        executionStatus: ExecutionStatus.NONE
                                    })
                                }}
                            >
                                {row.cells.map(cell => {
                                    const columnId = cell.column.id;
                                    const dqTargetData = (selectedDQ?.targets ?? []).find((data) => data.PROCESS_CMD_TGT_DQ_TEST_ID.toString() === row.id); // Get command data from commands array (for styling purposes
                                    const dqTargetStatus = columnId === 'dq_target_id' ? (dqTargetData?.ACTIVE === 'Y' ? true : false) : undefined // If cell is command_id, set status to true if command is active, and false if it isn't. If it's not a command_id cell, set status to undefined.
                                    return (
                                        <td {...cell.getCellProps()} className={`${styles[columnId]} ${styles[`dqTargetStatus-${dqTargetStatus}`]}`}>
                                            {cell.render('Cell')}
                                        </td>
                                    );

                                })}
                            </tr>
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

function generateTableData({ targets }: PropsInterface) {

    const tableColumns = useMemo(() => [
        {
            Header: 'Id',
            accessor: 'dq_target_id',
            Cell: getJSXForCommandId
        },
        {
            Header: 'Target',
            accessor: 'dq_target_name'
        },
        {
            Header: 'Attribute',
            accessor: 'dq_attribute_name'
        },
        {
            Header: 'Error & Abort',
            accessor: 'dq_error_and_abort'
        }
    ], []);

    const tableData = useMemo(() => targets.map((data) => ({
        dq_target_id: data.PROCESS_CMD_TGT_DQ_TEST_ID,
        dq_target_name: data.TGT_NAME,
        dq_attribute_name: data.ATTRIBUTE_NAME,
        dq_error_and_abort: data.ERROR_AND_ABORT === true ? "Yes" : "No"
    })), [targets]);

    const tableInstance = useTable<Data>({
        columns: tableColumns,
        data: tableData,
        getRowId: (row: any) => row.dq_target_id.toString()
    });

    return tableInstance;

    function getJSXForCommandId({ value }: {  // Prepare JSX for command id cell (including div wrappers for styling, and tooltip)
        value: DQTargetDataInterface['PROCESS_CMD_TGT_DQ_TEST_ID'];
    }) {
        const target = targets.find((data) => data.PROCESS_CMD_TGT_DQ_TEST_ID === value);
        const isActive = target?.ACTIVE === 'Y' ? true : false;
        const tooltipContent = <p>Target is <span>{isActive ? 'active' : 'inactive'}</span></p>

        return (
            <Tooltip label={tooltipContent} transitionProps={{ transition: 'scale' }}>
                <div className={styles.cellValueContainer}>
                    <div>{value}</div>
                </div>
            </Tooltip>
        )
    }
}