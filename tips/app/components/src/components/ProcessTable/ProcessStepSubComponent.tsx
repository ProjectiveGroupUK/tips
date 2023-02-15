// React
import { useCallback } from "react";

// React-table
import { TableInstance, Row } from "react-table";

// CSS
import tableStyle from "@/styles/processTable.module.css";

// Interfaces
import { ProcessDataInterface } from '@/interfaces/Interfaces';

interface PropsInterface {
    processData: ProcessDataInterface;
    row: Row;
    tableInstance: TableInstance<object>;
}

export default function ProcessStepSubComponent({ processData, row, tableInstance }: PropsInterface) {

    const { visibleColumns } = tableInstance;

    const renderRowSubComponent = useCallback(
        ({ row }: { row: Row }) => {
            const stepsForProcess = processData.find((process) => process.id.toString() === row.id)!.steps;
            return (
                <pre>
                    <code>{JSON.stringify({ values: stepsForProcess }, null, 2)}</code>
                </pre>
            )
        },
        []
    )

    return (
        <tr className={tableStyle.rowSubComponent}>
            <td colSpan={visibleColumns.length}>
                { renderRowSubComponent({ row }) }
            </td>
        </tr>
    )
}