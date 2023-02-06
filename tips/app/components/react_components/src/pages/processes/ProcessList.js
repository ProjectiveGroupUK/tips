import { Streamlit } from "streamlit-component-lib";
import { useEffect, useState } from 'react';
// @mui
import {
    // Tab,
    Tabs,
    Card,
    Table,
    Button,
    Tooltip,
    Divider,
    TableBody,
    Container,
    IconButton,
    TableContainer,
} from '@mui/material';
// components
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
import ConfirmDialog from '../../components/confirm-dialog';
import CustomBreadcrumbs from '../../components/custom-breadcrumbs';
import {
    useTable,
    getComparator,
    emptyRows,
    TableNoData,
    TableEmptyRows,
    TableHeadCustom,
    TableSelectedAction,
    TablePaginationCustom,
} from '../../components/table';
// sections
import { ProcessTableToolbar, ProcessTableRow } from '../../sections/processes/list';
// import LoadingScreen from '../../../components/loading-screen';

// ----------------------------------------------------------------------
const STATUS_OPTIONS = [
    'all',
    'active',
    'inactive',
];

const TABLE_HEAD = [
    { id: 'id', label: 'ID', alignRight: false },
    { id: 'name', label: 'Name', alignRight: false },
    { id: 'description', label: 'Description', alignRight: false },
    // { id: 'steps', label: 'Steps', alignRight: false },
    { id: 'status', label: 'Status', alignRight: false },
    { id: '' },
];

// ----------------------------------------------------------------------

export default function ProcessList({ dbData }) {
    // const { loading, error, data } = useQuery(GET_COMPANIES);
    // const [data, setData] = useState(dbData);

    const {
        dense,
        page,
        order,
        orderBy,
        rowsPerPage,
        setPage,
        //
        selected,
        setSelected,
        onSelectRow,
        onSelectAllRows,
        //
        onSort,
        onChangeDense,
        onChangePage,
        onChangeRowsPerPage,
    } = useTable();

    // const { themeStretch } = useSettingsContext();

    // const navigate = useNavigate();

    const [tableData, setTableData] = useState([]);

    const [openConfirm, setOpenConfirm] = useState(false);

    const [filterName, setFilterName] = useState('');

    const [filterStatus, setFilterStatus] = useState('all');

    const dataFiltered = applyFilter({
        inputData: tableData,
        comparator: getComparator(order, orderBy),
        filterName,
        filterStatus,
    });

    const dataInPage = dataFiltered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const denseHeight = dense ? 52 : 72;

    const isFiltered = filterName !== '' || filterStatus !== 'all';

    const isNotFound =
        (!dataFiltered.length && !!filterName) ||
        (!dataFiltered.length && !!filterStatus);

    const handleOpenConfirm = () => {
        setOpenConfirm(true);
    };

    const handleCloseConfirm = () => {
        setOpenConfirm(false);
    };

    const handleFilterStatus = (event) => {
        setPage(0);
        setFilterStatus(event.target.value);
    };

    const handleFilterName = (event) => {
        setPage(0);
        setFilterName(event.target.value);
    };

    const handleDeleteRow = (id) => {
        const deleteRow = tableData.filter((row) => row.id !== id);
        setSelected([]);
        setTableData(deleteRow);

        if (page > 0) {
            if (dataInPage.length < 2) {
                setPage(page - 1);
            }
        }
    };

    const handleDeleteRows = (selected) => {
        const deleteRows = tableData.filter((row) => !selected.includes(row.id));
        setSelected([]);
        setTableData(deleteRows);

        if (page > 0) {
            if (selected.length === dataInPage.length) {
                setPage(page - 1);
            } else if (selected.length === dataFiltered.length) {
                setPage(0);
            } else if (selected.length > dataInPage.length) {
                const newPage = Math.ceil((tableData.length - selected.length) / rowsPerPage) - 1;
                setPage(newPage);
            }
        }
    };

    const handleAddRow = () => {
        const responseData = { nextAction: "ProcessAdd" };
        Streamlit.setComponentValue(responseData)
        // navigate(PATH_MANAGEMENT.company.edit(paramCase(id)));
    };

    const handleEditRow = (id) => {
        console.log(id)
        // navigate(PATH_MANAGEMENT.company.edit(paramCase(id)));
    };

    const handleResetFilter = () => {
        setFilterName('');
        setFilterStatus('all');
    };

    useEffect(() => {
        if (dbData) {
            setTableData(dbData);
        }
    }, [dbData])

    return (
        <>
            <Container maxWidth={'lg'}>
                <CustomBreadcrumbs
                    heading="Process List"
                    links={[
                        { name: 'List' },
                    ]}
                    action={
                        <Button
                            // to={PATH_MANAGEMENT.company.add}
                            // component={RouterLink}
                            variant="contained"
                            startIcon={<Iconify icon="eva:plus-fill"/>}
                            onClick={handleAddRow}
                        >
                            Add
                        </Button>
                    }
                />

                <Card>
                    <Tabs
                        value={filterStatus}
                        onChange={handleFilterStatus}
                        sx={{
                            px: 2,
                            bgcolor: 'background.neutral',
                        }}
                    >
                        {/* {STATUS_OPTIONS.map((tab) => (
              <Tab key={tab} label={tab} value={tab} />
            ))} */}
                    </Tabs>

                    <Divider />

                    <ProcessTableToolbar
                        isFiltered={isFiltered}
                        filterName={filterName}
                        filterStatus={filterStatus}
                        optionsStatus={STATUS_OPTIONS}
                        onFilterName={handleFilterName}
                        onFilterStatus={handleFilterStatus}
                        onResetFilter={handleResetFilter}
                    />

                    <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
                        <TableSelectedAction
                            dense={dense}
                            numSelected={selected.length}
                            rowCount={tableData.length}
                            onSelectAllRows={(checked) =>
                                onSelectAllRows(
                                    checked,
                                    tableData.map((row) => row.id)
                                )
                            }
                            action={
                                <Tooltip title="Delete">
                                    <IconButton color="primary" onClick={handleOpenConfirm}>
                                        <Iconify icon="eva:trash-2-outline" />
                                    </IconButton>
                                </Tooltip>
                            }
                        />

                        <Scrollbar>
                            <Table size={dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
                                <TableHeadCustom
                                    order={order}
                                    orderBy={orderBy}
                                    headLabel={TABLE_HEAD}
                                    rowCount={tableData.length}
                                    numSelected={selected.length}
                                    onSort={onSort}
                                    onSelectAllRows={(checked) =>
                                        onSelectAllRows(
                                            checked,
                                            tableData.map((row) => row.id)
                                        )
                                    }
                                />

                                <TableBody>
                                    {dataFiltered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                                        <ProcessTableRow
                                            key={row.id}
                                            row={row}
                                            selected={selected.includes(row.id)}
                                            onSelectRow={() => onSelectRow(row.id)}
                                            onDeleteRow={() => handleDeleteRow(row.id)}
                                            onEditRow={() => handleEditRow(row.id)}
                                        />
                                    ))}

                                    <TableEmptyRows height={denseHeight} emptyRows={emptyRows(page, rowsPerPage, tableData.length)} />

                                    <TableNoData isNotFound={isNotFound} />
                                </TableBody>
                            </Table>
                        </Scrollbar>
                    </TableContainer>

                    <TablePaginationCustom
                        count={dataFiltered.length}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onPageChange={onChangePage}
                        onRowsPerPageChange={onChangeRowsPerPage}
                        //
                        dense={dense}
                        onChangeDense={onChangeDense}
                    />
                </Card>
            </Container>

            <ConfirmDialog
                open={openConfirm}
                onClose={handleCloseConfirm}
                title="Delete"
                content={
                    <>
                        Are you sure want to delete <strong> {selected.length} </strong> items?
                    </>
                }
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            handleDeleteRows(selected);
                            handleCloseConfirm();
                        }}
                    >
                        Delete
                    </Button>
                }
            />
        </>
    );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filterName, filterStatus }) {
    const stabilizedThis = inputData.map((el, index) => [el, index]);

    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });

    inputData = stabilizedThis.map((el) => el[0]);

    if (filterName) {
        inputData = inputData.filter((row) => row.name.toLowerCase().indexOf(filterName.toLowerCase()) !== -1);
    }

    if (filterStatus !== 'all') {
        inputData = inputData.filter((row) => row.status === filterStatus);
    }

    return inputData;
}
