// React
import { useMemo } from 'react';

// React-table
import { useTable } from 'react-table';

// Contexts
import { useProcessData } from '@/components/ProcessTable/contexts/ProcessDataContext';

// Interfaces
import { ProcessDataInterface, ArrayElement, CommandDataInterface } from '@/interfaces/Interfaces';

// CSS
import styles from '@/styles/commandsTable.module.css'

interface PropsInterface {
    commands: ArrayElement<ProcessDataInterface>['steps'];
}

type Data = object;

export default function ProcessCommandsTable() {
    const { selectedProcess } = useProcessData();
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = generateTableData({ commands: selectedProcess?.steps ?? [] });

    return (
        <table {...getTableProps()} className={styles.table}>
            <thead>
                {
                    headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {
                                headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps()}>
                                        <div>{ column.render('Header') }</div>
                                    </th>
                                ))}
                        </tr>
                    ))}
            </thead>

            <tbody {...getTableBodyProps()}>
            {
                rows.map((row) => {
                    prepareRow(row)
                    return (
                        <tr key={row.id}>
                            { row.cells.map(cell => {
                                const columnId = cell.column.id;
                                const commandData = (selectedProcess?.steps ?? []).find((command) => command.PROCESS_CMD_ID.toString() === row.id); // Get command data from commands array (for styling purposes
                                const commandStatus = columnId === 'command_id' ? (commandData?.ACTIVE === 'Y' ? true : false) : undefined // If cell is command_id, set commandStatus to true if command is active, and false if it isn't. If it's not a command_id cell, set commandStatus to undefined.
                                return (
                                    <td {...cell.getCellProps()} className={`${styles[columnId]} ${styles[`commandStatus-${commandStatus}`]}`}>
                                        { cell.render('Cell') }
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
                    { /* Footer */ }
                </td>
                </tr>
            </tfoot>
        </table>
    );
}

function generateTableData({ commands }: PropsInterface) {
    const tableColumns = useMemo(() => [
        {
            Header: 'Id',
            accessor: 'command_id',
            Cell: ({ value }: { value: CommandDataInterface['PROCESS_CMD_ID'] }) => <div><div>{value}</div></div> // Wrap cell contents in a two divs for styling purposes (first div to center the second div, which is a colour-coded circle containing the cell value)
        },
        {
            Header: 'Type',
            accessor: 'command_type'
        },
        {
            Header: 'Source',
            accessor: 'command_source'
        },
        {
            Header: 'Target',
            accessor: 'command_target'
        }
    ], []);

    const tableData = useMemo(() => commands.map((command) => ({
        command_id: command.PROCESS_CMD_ID,
        command_type: command.CMD_TYPE,
        command_source: command.CMD_SRC,
        command_target: command.CMD_TGT
    })), []);

    const tableInstance = useTable<Data>({
        columns: tableColumns,
        data: tableData,
        getRowId: (row: any) => (row.command_id.toString())
    });

    return tableInstance;
}