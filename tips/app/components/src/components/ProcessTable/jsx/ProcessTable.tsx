// React
import { Fragment, useEffect, useMemo } from 'react';

// StreamLit
import { Streamlit } from 'streamlit-component-lib';

// React-table
import { useTable, useExpanded } from 'react-table';

// Contexts
import { useSharedData } from '@/components/reusable/contexts/SharedDataContext';

// Interfaces
import { ProcessDataInterface } from '@/interfaces/Interfaces';

// CSS
import tableStyle from '@/styles/processTable/processTable.module.css';

// Components
import StatusPill from '@/components/ProcessTable/jsx/StatusPill';
import ProcessCommandsTable from './ProcessCommandsTable';

type Data = object;

export default function ProcessTable() {
    useEffect(() => { Streamlit.setFrameHeight(); }); // Update frame height on each re-render
    const { processData, selectedProcess, setSelectedProcessId } = useSharedData();

    const tableInstance = generateTableData({ processData: processData });
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

    useEffect(() => { // Expand row when clicked
        rows.forEach((row) => row.toggleRowExpanded(row.id === selectedProcess?.id.toString()))
    }, [selectedProcess?.id])

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
                rows.map((row, index) => {
                    prepareRow(row)
                    const isSelected = row.id === selectedProcess?.id.toString();
                    const expandedRowExistsAbove = rows.some((row, i) => i < index && row.isExpanded); // Used for styling purposes to determine colour of row (since :even and :odd selectors don't work with expanded rows the way I need them to)
                    const dynamicIndexIsEven = (index - (Number(expandedRowExistsAbove) * 2)) % 2 === 0;
                    
                    return (
                        <Fragment key={row.id}>
                            <tr
                                className={`${isSelected && tableStyle.selected} ${dynamicIndexIsEven ? tableStyle.dynamicIndex_even : tableStyle.dynamicIndex_odd}`} // If row is expanded, add 'selected' class; and depending on dynamicIndex, add 'dynamicIndex-even' or 'dynamicIndex-odd' class
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
                                <tr className={`${tableStyle.rowSubComponent} ${dynamicIndexIsEven ? tableStyle.dynamicIndex_even : tableStyle.dynamicIndex_odd}`}>
                                    <td colSpan={100}> {/* Should be equal to or greater than number of columns in table to span across all columns */}
                                        <div>
                                            <ProcessCommandsTable />
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

function generateTableData({ processData }: {
    processData: ProcessDataInterface
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