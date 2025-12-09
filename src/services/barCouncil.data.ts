/**
 * Mock Bar Council Database
 * 
 * This file simulates an external government database of registered lawyers.
 * In a real application, this would be replaced by an API call to the Bar Council's system.
 */

export interface BarCouncilRecord {
    licenseNumber: string; // 8-digit alphanumeric
    fullName: string;
    barId: string;
    cnic: string; // Now required for strict matching
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
}

export const BAR_COUNCIL_DB: BarCouncilRecord[] = [
    {
        licenseNumber: 'LHR12345',
        fullName: 'Adv. Sarah Ahmed',
        barId: 'LHC-2015-889',
        cnic: '35202-1234567-1',
        status: 'ACTIVE'
    },
    {
        licenseNumber: 'KHI98765',
        fullName: 'Adv. Ali Khan',
        barId: 'SHC-2010-442',
        cnic: '42101-7654321-3',
        status: 'ACTIVE'
    },
    {
        licenseNumber: 'ISL54321',
        fullName: 'Adv. Bilal Hassan',
        barId: 'IHC-2018-123',
        cnic: '61101-9876543-5',
        status: 'ACTIVE'
    },
    {
        licenseNumber: 'PWR67890',
        fullName: 'Adv. Zara Shah',
        barId: 'PHC-2012-555',
        cnic: '17301-3456789-2',
        status: 'ACTIVE'
    },
    {
        licenseNumber: 'QTA11223',
        fullName: 'Adv. Omar Farooq',
        barId: 'BHC-2019-777',
        cnic: '54400-5678901-9',
        status: 'ACTIVE'
    },
    // Random Data 1
    {
        licenseNumber: 'MUL33445',
        fullName: 'Adv. Hamza Malik',
        barId: 'MHC-2020-001',
        cnic: '36302-1112223-4',
        status: 'ACTIVE'
    },
    // Random Data 2
    {
        licenseNumber: 'FSD55667',
        fullName: 'Adv. Ayesha Siddiqui',
        barId: 'FHC-2021-099',
        cnic: '33100-4445556-7',
        status: 'ACTIVE'
    },
    // Random Data 3
    {
        licenseNumber: 'RAW88990',
        fullName: 'Adv. Usman Tariq',
        barId: 'RHC-2017-333',
        cnic: '37405-7778889-1',
        status: 'ACTIVE'
    },
    // Random Data 4
    {
        licenseNumber: 'SKT11223',
        fullName: 'Adv. Fatima Bibi',
        barId: 'SHC-2019-222',
        cnic: '34603-9990001-5',
        status: 'ACTIVE'
    },
    // Random Data 5
    {
        licenseNumber: 'GUJ44556',
        fullName: 'Adv. Hassan Raza',
        barId: 'GHC-2016-444',
        cnic: '34101-2223334-8',
        status: 'ACTIVE'
    },
    // Test record
    {
        licenseNumber: 'TEST1234',
        fullName: 'Test Lawyer',
        barId: 'TEST-BAR-001',
        cnic: '11111-1111111-1',
        status: 'ACTIVE'
    },
    // New User Test Case
    {
        licenseNumber: 'ABD12345',
        fullName: 'Adv. Abdullah Bin Aqeel',
        barId: 'ICT-2024-001',
        cnic: '35201-1122334-4',
        status: 'ACTIVE'
    }
];

export const verifyLicense = (licenseNumber: string, cnic: string, fullName: string): BarCouncilRecord | null => {
    // Normalize inputs
    const normalizedLicense = licenseNumber.toUpperCase().trim();
    const normalizedInputCnic = cnic.replace(/-/g, '').trim();

    // Normalize name: remove "Adv.", "Advocate", extra spaces, lowercase
    const normalizeName = (name: string) => {
        return name
            .toLowerCase()
            .replace(/^adv\.\s*|^advocate\s*/, '') // Remove prefix
            .replace(/[^a-z\s]/g, '') // Keep only letters and spaces
            .trim();
    };

    const normalizedInputName = normalizeName(fullName);

    // Find record matching LICENSE ONLY first
    const record = BAR_COUNCIL_DB.find(
        r => r.licenseNumber.toUpperCase() === normalizedLicense
    );

    if (!record || record.status !== 'ACTIVE') {
        return null;
    }

    // Check strict CNIC match
    const normalizedRecordCnic = record.cnic.replace(/-/g, '');
    if (normalizedRecordCnic !== normalizedInputCnic) {
        console.log(`CNIC Mismatch: Input ${normalizedInputCnic} vs Record ${normalizedRecordCnic}`);
        return null;
    }

    // Check Name match (Fuzzy)
    const normalizedRecordName = normalizeName(record.fullName);

    // Check if one contains the other (handles "Ali Khan" matching "Adv. Ali Khan")
    if (!normalizedRecordName.includes(normalizedInputName) &&
        !normalizedInputName.includes(normalizedRecordName)) {
        console.log(`Name Mismatch: Input "${normalizedInputName}" vs Record "${normalizedRecordName}"`);
        return null;
    }

    return record;
};
