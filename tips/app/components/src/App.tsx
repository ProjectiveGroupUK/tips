// React
import { useEffect, useState, useMemo } from 'react';

// StreamLit
import { Streamlit, withStreamlitConnection, ComponentProps } from 'streamlit-component-lib';

// React-table
import { useTable, usePagination, useFilters } from 'react-table';

// CSS
import './styles/global.css'

interface PropsInterface {
  data: Array<{
    id: number;
    name: string;
    description: string;
    steps: Array<{
      PROCESS_ID: number;
      PROCSS_NAME: string;
      PROCESS_DESCRIPTION: string;
      PROCESS_ACTIVE: 'Y' | 'N';
      PROCESS_CMD_ID: number;
      CMD_TYPE: 'APPEND' | 'COPY_INTO_FILE' | 'DELETE'| 'DI' | 'MERGE' | 'OI' | 'PUBLISH_SCD2_DIM' | 'REFRESH' | 'TI' | 'TRUNCATE';
      CMD_SRC: string;
      CND_TGT: string;
      CMD_WHERE: string;
      CMD_BINDS: string;
      REFRESH_TYPE: 'DI' | null;
      BUSINESS_KEY: string;
      MERGE_ON_FIELDS: string;
      GENERATE_MERGE_MATCHED_CLAUSE: 'Y' | '';
      GENERATE_MERGE_NON_MATCHED_CLAUSE: 'Y' | '';
      ADDITIONAL_FIELDS: string;
      TEMP_TABLE: 'Y' | null;
      CMD_PIVOT_BY: string | null;
      CMD_PIVOT_FIELD: string | null;
      DQ_TYPE: 'DUPS' | 'SCD2' | '';
      CMD_EXTERNAL_CALL: string;
      ACTIVE: 'Y' | 'N'; 
    }>
  }>
}

type Data = object;

function App(props: ComponentProps) {
  const { data }: PropsInterface = props.args;
  useEffect(() => { Streamlit.setFrameHeight() }); // Update frame height on each re-render

  const tableColumns = useMemo(() => [
    {
      Header: 'Id',
      accessor: 'process_id'
    },
    {
      Header: 'Name',
      accessor: 'process_name'
    }
  ], []);

  const tableData = useMemo(() => data.map((process) => ({
    process_id: process.id,
    process_name: process.name
  })), []);

  const tableInstance = useTable<Data>({
    columns: tableColumns,
    data: tableData
  });
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance

  return (
    <table {...getTableProps()}>
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

export default withStreamlitConnection(App)