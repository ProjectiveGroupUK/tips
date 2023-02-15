// React
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

// StreamLit
import { Streamlit } from 'streamlit-component-lib';

// React-table
import { useTable, useExpanded, Row } from 'react-table';

// Interfaces
import { ProcessDataInterface } from '@/interfaces/Interfaces';

// CSS
import tableStyle from '@/styles/processTable.module.css';

// Components
import StatusPill from '@/components/ProcessTable/StatusPill';

// Mock data
import mockDataSet from '@/mockData/mockProcessData';

interface PropsInterface {
  processData: ProcessDataInterface;
}

type Data = object;

export default function ProcessTable({ processData }: PropsInterface) {
    useEffect(() => { Streamlit.setFrameHeight() }); // Update frame height on each re-render

    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    useEffect(() => { // Expand row when clicked
        rows.forEach((row) => {
            row.toggleRowExpanded(row.id === expandedRowId)
        })
    }, [expandedRowId])

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

    const tableData = useMemo(() => mockDataSet/*processData*/.map((process) => ({
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
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, visibleColumns, state: { expanded } } = tableInstance

    const renderRowSubComponent = useCallback(
        ({ row }: { row: Row }) => {
            const stepsForProcess = mockDataSet/*processData*/.find((process) => process.id.toString() === row.id)!.steps;
            return (
                <pre>
                    <code>{JSON.stringify({ values: stepsForProcess }, null, 2)}</code>
                </pre>
            )
        },
        []
      )

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
                            <tr onClick={() => {
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
                            { row.isExpanded && (
                                <tr className={tableStyle.rowSubComponent}>
                                    <td colSpan={visibleColumns.length}>
                                        { renderRowSubComponent({ row }) }
                                    </td>
                                </tr>
                            )}
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
    )
}