// React
import { useMemo, useEffect } from 'react';

// StreamLit
import { Streamlit } from 'streamlit-component-lib';

// React-table
import { useTable } from 'react-table';

// Interfaces
import { ProcessDataInterface } from '@/Interfaces';

// CSS
import tableStyle from '@/styles/processTable.module.css';

interface PropsInterface {
  processData: ProcessDataInterface;
}

type Data = object;

export default function ProcessTable({ processData }: PropsInterface) {
    useEffect(() => { Streamlit.setFrameHeight() }); // Update frame height on each re-render

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
        }
    ], []);

    const tableData = useMemo(() => processData.map((process) => ({
        process_id: process.id,
        process_name: process.name,
        process_description: process.description,
        process_status: process.status
    })), []);

    const tableInstance = useTable<Data>({
        columns: tableColumns,
        data: tableData
    });
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance

    return (
        <table {...getTableProps()} className={tableStyle.table}>
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
                rows.map((row) => {
                    prepareRow(row)
                    return (
                    <tr {...row.getRowProps()}>
                        {
                        row.cells.map(cell => (
                            <td {...cell.getCellProps()}>
                            { cell.render('Cell') }
                            </td>
                        ))
                        }
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
    )
}