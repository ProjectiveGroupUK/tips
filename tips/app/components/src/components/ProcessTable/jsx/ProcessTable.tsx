// React
import { Fragment, useEffect, useMemo, useState } from 'react';

// StreamLit
import { Streamlit } from 'streamlit-component-lib';

// React-table
import { useTable, useExpanded } from 'react-table';

// Interfaces
import { ProcessDataInterface } from '@/interfaces/Interfaces';

// CSS
import tableStyle from '@/styles/processTable.module.css';

// Components
import StatusPill from '@/components/ProcessTable/jsx/StatusPill';
import ProcessCommandsTable from './ProcessCommandsTable';

// Mock data
import mockDataSet from '@/mockData/mockProcessData';

interface PropsInterface {
  processData: ProcessDataInterface;
}

type Data = object;

export default function ProcessTable({ processData }: PropsInterface) {
    useEffect(() => { Streamlit.setFrameHeight() }); // Update frame height on each re-render

    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const tableInstance = generateTableData({ processData: mockDataSet/*processData*/ });
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

    useEffect(() => { // Expand row when clicked
        rows.forEach((row) => row.toggleRowExpanded(row.id === expandedRowId))
    }, [expandedRowId])

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
                        <Fragment key={row.id}>
                            <tr 
                                className={row.id === expandedRowId ? tableStyle.selected : undefined} // If row is expanded, add 'selected' class
                                onClick={() => { // When clicked, update expandedRowId state variable
                                    setExpandedRowId((prev) => prev === row.id ? null : row.id)
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
                                <tr className={tableStyle.rowSubComponent}>
                                    <td colSpan={100}> {/* Should be equal to or greater than number of columns in table to span across all columns */}
                                        <div>
                                            <ProcessCommandsTable 
                                                commands={mockDataSet/*processData*/.find((process) => process.id.toString() === row.id)!.steps} // returns steps for process whose id matches the row id
                                            />
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

function generateTableData({ processData }: PropsInterface) {
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
        data: tableData,
        getRowId: (row: any) => (row.process_id.toString())
    }, useExpanded);

    return tableInstance;
}