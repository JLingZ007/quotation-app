// components/pdf/QuotationPDF.jsx
import React from 'react';
import {
    Page, Text, View, Document, StyleSheet, Font, Image
} from '@react-pdf/renderer';
import { numberToThaiText } from '../../utils/numberToThaiText'; // ปรับ path ให้ตรง


// ลงทะเบียนฟอนต์ไทย
Font.register({
    family: 'THSarabunNew',
    src: '/fonts/THSarabunNew.ttf',
});

Font.register({
    family: 'THSarabunNew-Bold',
    src: '/fonts/THSarabunNew Bold.ttf',
});

Font.register({
    family: 'THSarabunNew-Italic',
    src: '/fonts/THSarabunNew Italic.ttf',
});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
        fontFamily: 'THSarabunNew',
    },
    header: {
        position: 'relative',   // สำคัญสำหรับ logo absolute จะอ้างอิงตำแหน่งจากตรงนี้
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 10,
    },

    docTitleContainer: {
        alignItems: 'center',
        marginBottom: 6,
    },

    docTitle: {
        fontSize: 24,
        fontFamily: 'THSarabunNew-Bold',
    },

    companyInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    companyInfo: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'flex-start',
    },


    companyLogo: {
        position: 'absolute',
        top: -17,
        left: 0,
        width: 140,
        height: 140,
        objectFit: 'contain',
        margin: 0,           // กัน margin ใด ๆ
        padding: 0,          // กัน padding ใด ๆ
        zIndex: 10,          // เผื่อทับข้อความอื่น
    },

    companyDetails: {
        flexShrink: 1,
        paddingLeft: 170,
    },

    companyName: {
        fontSize: 21,
        fontFamily: 'THSarabunNew-Bold',
    },

    companyEnName: {
        fontSize: 14,
        fontFamily: 'THSarabunNew-Bold',
    },

    companyAddress: {
        fontSize: 11,
    },

    docInfo: {
        minWidth: 130,
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        // marginLeft: 15,
    },

    docNumber: {
        fontSize: 14,
        marginTop: 3,
    },


    customerSection: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 4,
        // marginBottom: 2,
    },
    customerInfo: {
        flex: 1,
    },
    carInfo: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'THSarabunNew-Bold',
        marginBottom: 2,
    },
    infoText: {
        fontSize: 14,
    },
    smallText: {
        fontSize: 14,
    },


    bold: {
        fontFamily: 'THSarabunNew-Bold',
    },

    condition: {
        marginTop: 8,
    },
    head: {
        fontSize: 20,
        fontFamily: 'THSarabunNew-Bold',
        marginTop: 6,
    },
    text: {
        fontSize: 16,
    }
});


const VehicleReceivePDF = ({ form, services = [], brand, model, docNumber }) => {


    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
                <View style={styles.header}>
                    {/* ใบเสนอราคา ตรงกลาง */}
                    <Image src="/logo.png" style={styles.companyLogo} />
                    <View style={styles.docTitleContainer}>
                        <Text style={styles.docTitle}>ใบรับรถ</Text>
                    </View>
                    {/* ข้อมูลบริษัท & เลขที่เอกสาร */}
                    <View style={styles.companyInfoRow}>
                        <View style={styles.companyInfo}>

                            <View style={styles.companyDetails}>
                                <Text style={styles.companyName}>บริษัท ถึงแก่น อีลิท ชิลด์ จำกัด</Text>
                                <Text style={styles.companyEnName}>THUENGKAEN ELITE SHIELD CO.,LTD.</Text>
                                <Text style={styles.companyAddress}>
                                    149/1 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000
                                </Text>
                                <Text style={styles.companyAddress}>เบอร์โทร: 082-659-5365, 063-686-9999</Text>
                                <Text style={styles.companyAddress}>
                                    เลขประจำตัวผู้เสียภาษีอากร: 0405566002141
                                </Text>
                            </View>
                        </View>

                        <View style={styles.docInfo}>
                            <Text style={styles.docNumber}>เลขที่: {docNumber || form?.id_number || '-'}</Text>
                            <Text style={styles.docNumber}>วันที่: {new Date().toLocaleDateString('th-TH')}</Text>
                        </View>
                    </View>
                </View>


                {/* Customer Details */}
                <View style={styles.customerSection}>
                    <View style={styles.customerInfo}>
                        <Text style={styles.sectionTitle}>ข้อมูลลูกค้า</Text>
                        <Text style={[styles.infoText, styles.bold]}>ชื่อ : {form?.customerName || '-'}</Text>
                        <Text style={styles.infoText}>เบอร์โทร: {form?.phone || '-'}</Text>
                        {services.length > 0 && (
                            <View style={{ marginTop: 6 }}>
                                <Text style={[styles.infoText, styles.bold]}>บริการที่ทำ:</Text>
                                {services.map((service, index) => (
                                    <Text key={index} style={styles.infoText}>• {service.name}</Text>
                                ))}
                            </View>
                        )}
                    </View>
                    <View style={styles.carInfo}>
                        <Text style={styles.sectionTitle}>ข้อมูลรถ</Text>
                        <Text style={styles.infoText}>
                            ข้อมูลรถยนต์: {brand?.name || '-'} {model?.name || '-'} | {form?.year && <Text style={styles.infoText}>ปีรถ: {form.year}</Text>}
                        </Text>
                        <Text style={styles.infoText}>เลขทะเบียน: {form?.license || '-'} {form?.province || ''}</Text>

                        {form?.vin && <Text style={styles.infoText}>เลขตัวถัง (VIN): {form.vin} | เลขไมล์: {form.mileage} กิโลเมตร</Text>}
                    </View>
                </View>
                {/* Condition เงื่อนไช */}
                <View>
                    <View style={styles.condition}>
                        <Text style={styles.head}>เงื่อนไขการรับรถ Notice for vehicle received</Text>
                        <Text style={styles.text}>- เอกสารฉบับนี้ออกให้ลูกค้าวัตถุประสงค์เพื่อเป็นหลักฐานว่า ลูกค้าได้นำรถมาจอดในพื้นที่ของบริษัทเพื่อรอรับบริการเท่านั้น {"\n"}
                            this document is issued to the customer as evidence that customers had parking car in the company area
                            to wait in line for services.
                        </Text>
                        <Text style={styles.text}>- ทางบริษัทไม่รับผิดชอบความสูญหายของทรัพย์สินภายในรถทุกกรณี เจ้าของรถต้องเก็บสิ่งของมีค่าออกจากรถให้เรียบร้อย {"\n"}
                            The company is not responsible for the loss of property inside the vehicle in any case. Car owners must move
                            valuables from their vehicle.
                        </Text>
                        <Text style={styles.text}>- บริษัทสามารถเคลื่อนย้ายจุดจอดให้เหมาะสมได้ ทั้งนี้บริษัทพยายามสุดความสามารถที่จะป้องกันรถของท่านจากการเฉี่ยวชนจากรถคันอื่น
                            หากเกิดเหตุการณ์ดังกล่าวขึ้น อู่สงวนสิทธิ์พิจารณาความเหมาะสมที่จะรับผิดชอบซ่อมแซม หรือปฏิเสธความรับผิดชอบและให้ประกันภัยรถเป็นผู้รับผิดชอบ {"\n"}
                            The Company can move the parking spot to suit. However, the company tries its best to protect your car from collisions
                            with other cars. if sush an event occurs The company reserves the right ti consider the appropriateness to be responsible
                            for repairs or deny responsibility and let the car insurance be responsible.
                        </Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
};

export default VehicleReceivePDF;