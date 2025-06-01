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
    top: -20,
    left: 0,
    width: 150,
    height: 150,
    objectFit: 'contain',
    margin: 0,           // กัน margin ใด ๆ
    padding: 0,          // กัน padding ใด ๆ
    zIndex: 10,          // เผื่อทับข้อความอื่น
  },



  companyDetails: {
    flexShrink: 1,
    paddingLeft: 150,
  },

  companyName: {
    fontSize: 19,
    fontFamily: 'THSarabunNew-Bold',
  },

  companyEnName: {
    fontSize: 14,
    fontFamily: 'THSarabunNew-Bold',
  },

  companyAddress: {
    fontSize: 12,
  },

  docInfo: {
    minWidth: 130,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: 20,
  },

  docNumber: {
    fontSize: 14,
    marginTop: 5,
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
    fontSize: 14,
    fontFamily: 'THSarabunNew-Bold',
    marginBottom: 1,
  },
  infoText: {
    fontSize: 13,
  },
  smallText: {
    fontSize: 13,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e5e5e5',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    minHeight: 26,
  },
  emptyRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    minHeight: 20,
  },
  tableCell: {
    padding: 2,
    fontSize: 14,
  },
  ordinalCell: {
    width: '8%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'center',
  },
  descriptionCell: {
    width: '54%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'center',

  },
  quantityCell: {
    width: '10%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'center',
  },
  unitPriceCell: {
    width: '14%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'right',
  },
  amountCell: {
    width: '14%',
    textAlign: 'right',
  },
  totalTextRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#e5e5e5',
  },
  totalTextLabel: {
    width: '7.85%',
    padding: 4,
    fontFamily: 'THSarabunNew-Bold',
    fontSize: 14,
    textAlign: 'center',
  },
  totalTextValue: {
    width: '70%',
    padding: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#000',
    fontSize: 14,
  },
  footerSection: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },

  warrantySection: {
    flex: 2,
    paddingRight: 10,
  },

  warrantyBox: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 8,
    backgroundColor: '#f9f9f9',
    minHeight: 130, // เดิม 120
  },

  totalSection: {
    flex: 1,
  },

  totalTable: {
    borderWidth: 1,
    borderColor: '#000',
  },

  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },

  totalLabelCell: {
    width: '60%',
    paddingVertical: 2,       // ลดจากค่าเดิม
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
    justifyContent: 'center',
    fontSize: 14,
    lineHeight: 1,           // เพิ่มบังคับชิดบรรทัด
  },

  totalValueCell: {
    width: '40%',
    paddingVertical: 2,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
    fontSize: 14,
    lineHeight: 1,
  },


  grandTotalLabel: {
    width: '60%',
    paddingRight: 4,
    paddingLeft: 4,
    paddingBottom: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 15,
    fontFamily: 'THSarabunNew-Bold',
    backgroundColor: '#fff',
    justifyContent: 'center',
    lineHeight: 1,
  },

  grandTotalValue: {
    width: '40%',
    paddingRight: 4,
    paddingBottom: 4,
    alignItems: 'flex-end',
    justifyContent: 'center',
    fontSize: 15,
    fontFamily: 'THSarabunNew-Bold',
    backgroundColor: '#fff',
  },

  signaturesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 10,
  },

  signatureBox: {
    width: '32%',
    borderWidth: 1,
    borderColor: '#000',
    padding: 6,
    height: 70,
    justifyContent: 'space-between',
  },

  signatureLabel: {
    fontSize: 12,
  },

  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 20,
    paddingTop: 5,
  },

  companySignature: {
    fontSize: 12,
    textAlign: 'center',
  },

  bold: {
    fontFamily: 'THSarabunNew-Bold',
  },
});



// ฟังก์ชันจัดรูปแบบตัวเลขให้มีคอมม่า
const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const QuotationPDF = ({ form, services = [], brand, model, remark, warranty = [], deposit = 0, discount = 0, docNumber, totalPrice = 0 }) => {
  // คำนวณราคา
  const calculateSubtotal = () => {
    if (!services || services.length === 0) {
      // ถ้าไม่มีบริการ ให้ใช้ totalPrice จาก content
      return form?.totalPrice ? parseFloat(form.totalPrice) : 0;
    }

    return services.reduce((total, service) => {
      return total + (parseFloat(service.price) || 0) * (service.quantity || 1);
    }, 0);
  };
  const subtotal = calculateSubtotal();
  const grandTotal = subtotal - discount - deposit;

  // คำนวณจำนวนแถวว่างเพื่อให้ตารางสวยงาม
  const emptyRowsCount = Math.max(0, 6 - services.length);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          {/* ใบเสนอราคา ตรงกลาง */}
          <Image src="/logo.png" style={styles.companyLogo} />
          <View style={styles.docTitleContainer}>
            <Text style={styles.docTitle}>ใบเสนอราคา</Text>
          </View>
          {/* ข้อมูลบริษัท & เลขที่เอกสาร */}
          <View style={styles.companyInfoRow}>
            <View style={styles.companyInfo}>

              <View style={styles.companyDetails}>
                <Text style={styles.companyName}>บริษัท ถึงแก่น อีลิท ชิลด์ จำกัด</Text>
                <Text style={styles.companyEnName}>THUENGKAEN CO.,LTD.</Text>
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

        {/* Services Table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>รายการค่าบริการ</Text>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.ordinalCell]}>
              <Text>ลำดับ</Text>
              <Text>(No.)</Text>
            </View>
            <View style={[styles.tableCell, styles.descriptionCell]}>
              <Text>รายละเอียด</Text>
              <Text>(Description)</Text>
            </View>
            <View style={[styles.tableCell, styles.quantityCell]}>
              <Text>จำนวน</Text>
              <Text>(Quantity)</Text>
            </View>
            <View style={[styles.tableCell, styles.unitPriceCell]}>
              <Text>ราคาต่อหน่วย</Text>
            </View>
            <View style={[styles.tableCell, styles.amountCell]}>
              <Text>จำนวนเงิน</Text>
            </View>
          </View>

          {/* Table Rows */}
          {Array.isArray(services) && services.length > 0 ? (
            services.map((service, index) => (
              <View key={`service-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.ordinalCell]}>
                  <Text>{index + 1}</Text>
                </View>
                <View style={[styles.tableCell, styles.descriptionCell, { textAlign: 'left' }]}>
                  <Text>{service.name}</Text>
                </View>
                <View style={[styles.tableCell, styles.quantityCell]}>
                  <Text>{service.quantity || 1}</Text>
                </View>
                <View style={[styles.tableCell, styles.unitPriceCell]}>
                  <Text>{numberWithCommas(service.price || 0)}</Text>
                </View>
                <View style={[styles.tableCell, styles.amountCell]}>
                  <Text>{numberWithCommas((service.price || 0) * (service.quantity || 1))}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { width: '100%', textAlign: 'center' }]}>
                <Text></Text>
              </View>
            </View>
          )}

          {/* Empty rows to make the table look nicer */}
          {Array.from({ length: emptyRowsCount }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.emptyRow}>
              <View style={[styles.tableCell, styles.ordinalCell]}>
                <Text> </Text>
              </View>
              <View style={[styles.tableCell, styles.descriptionCell]}>
                <Text> </Text>
              </View>
              <View style={[styles.tableCell, styles.quantityCell]}>
                <Text> </Text>
              </View>
              <View style={[styles.tableCell, styles.unitPriceCell]}>
                <Text> </Text>
              </View>
              <View style={[styles.tableCell, styles.amountCell]}>
                <Text> </Text>
              </View>
            </View>
          ))}

          {/* Total Text Row */}
          <View style={styles.totalTextRow}>
            <View style={styles.totalTextLabel}>
              <Text>ตัวอักษร</Text>
            </View>
            <View style={styles.totalTextValue}>
              <Text>({numberToThaiText(grandTotal)})</Text>
            </View>
          </View>
          <View style={styles.totalTextRow}>
            <View style={styles.totalTextLabel}>
              <Text>หมายเหตุ</Text>
            </View>
            <View style={styles.totalTextValue}>
              <Text>{remark}</Text>
            </View>
          </View>
        </View>

        {/* Footer Section with Warranty and Totals */}
        <View style={styles.footerSection}>
          {/* Warranty Terms */}
          <View style={styles.warrantySection}>
            <View style={styles.warrantyBox}>
              <Text style={[styles.sectionTitle, { marginBottom: 1 }]}>เงื่อนไขการรับประกัน</Text>

              {warranty.length > 0 ? (
                <View>
                  <Text style={styles.smallText}>
                    <Text style={styles.bold}>เงื่อนไข: </Text>
                    {warranty.map(w => w.name).join(', ')}
                  </Text>

                  <Text style={[styles.smallText, styles.bold, { marginTop: 1 }]}>ข้อยกเว้น:</Text>
                  <Text style={styles.smallText}>
                    รถผู้ถือบัตรเกิดอุบัติเหตุทุกกรณี หรือ ความเสียหายที่เกิดจากความตั้งใจ เช่น ขูด, ขัด, กรีด, ลอก โดยบุคคลที่ไม่ใช่ช่างของศูนย์บริการ
                  </Text>

                  <Text style={[styles.smallText, styles.bold, { marginTop: 1 }]}>ช่องทางการชำระเงิน:</Text>
                  <Text style={styles.smallText}>
                    ธนาคารกสิกรไทย เลขบัญชี 290-2-58522-5 ชื่อบัญชี กุลชรี
                  </Text>
                </View>
              ) : (
                <Text style={[styles.smallText, {  color: '#666' }]}>
                  ไม่มีข้อมูลเงื่อนไขการรับประกัน
                </Text>
              )}
            </View>
          </View>

          {/* Totals */}
          <View style={styles.totalSection}>
            <View style={styles.totalTable}>
              <View style={styles.totalRow}>
                <View style={styles.totalLabelCell}>
                  <Text>ยอดรวม{"\n"}TOTAL</Text>
                </View>
                <View style={styles.totalValueCell}>
                  <Text>{numberWithCommas(totalPrice)}</Text>
                </View>
              </View>
              <View style={styles.totalRow}>
                <View style={styles.totalLabelCell}>
                  <Text>ส่วนลด{"\n"}DISCOUNT</Text>
                </View>
                <View style={styles.totalValueCell}>
                  <Text>{numberWithCommas(discount)}</Text>
                </View>
              </View>
              <View style={styles.totalRow}>
                <View style={styles.totalLabelCell}>
                  <Text>มัดจำจ่าย{"\n"}DEPOSIT</Text>
                </View>
                <View style={styles.totalValueCell}>
                  <Text>{numberWithCommas(deposit)}</Text>
                </View>
              </View>
              <View style={styles.totalRow}>
                <View style={styles.grandTotalLabel}>
                  <Text>ยอดรวมสุทธิ{"\n"}GRAND TOTAL</Text>
                </View>
                <View style={styles.grandTotalValue}>
                  <Text>{numberWithCommas(grandTotal)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signaturesSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>ลงนามลูกค้า</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>วันที่</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>ลงนามพนักงาน</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>วันที่</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.companySignature}>ในนาม บริษัท ถึงแก่น อีลิท ชิลด์ จำกัด</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>ผู้มีอำนาจลงนาม</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default QuotationPDF;