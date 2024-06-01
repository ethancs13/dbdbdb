import React, { useState, useEffect } from 'react';

function info(props) {
    const data = props.data;
    const [rowData, setRowData] = useState([]);

    useEffect(() => {
        if (data && Array.isArray(data)) {
            let allRowData = data.filter(item => typeof item === 'object' && item !== null);
            setRowData(allRowData);
        }
    }, [data]);

    return (
        <tbody className='additional-info'>
            <tr className='table-header'>
                <th className='name-header'>Name</th>
                <th className='email-header'>Email</th>
                <th>Cellphone</th>
                <th></th>
                <th>Landline</th>
                <th></th>
                <th>Long Distance</th>
                <th></th>
                <th>Broadband</th>
                <th></th>
                <th>Entertainment</th>
                <th></th>
                <th>Document</th>
            </tr>
            {rowData.map((row, rowIndex) => (
                <tr className='data-row-container' key={rowIndex}>
                    {Object.entries(row).map(([key, value], entryIndex) => (
                        key === 'doc_path' ? (
                            null
                        )
                        :
                        key !== 'id' && key !== 'ln' && (
                            <td key={entryIndex} className='data-cell'>
                                {value === 0 ? (
                                    <p>❌</p>
                                ) : value === 1 ? (
                                    <p>✔️</p>
                                ) : (
                                    <p>{value}</p>
                                )}
                            </td>
                        )
                    ))}
                </tr>
            ))}
        </tbody>
    );
}

export default info;
