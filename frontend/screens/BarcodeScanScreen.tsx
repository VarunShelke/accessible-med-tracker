import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import {ScanMode, ScannedItem} from '@/types/inventory';
import {ScanConfirmation} from '@/components/ScanConfirmation';
import {colors} from '@/styles/colors';
import {spacing, touchTarget, fontSize} from '@/styles/spacing';

export const BarcodeScanScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<ScanMode | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

  const device = useCameraDevice('back');

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'code-128', 'code-39', 'upc-a', 'upc-e'],
    onCodeScanned: codes => {
      if (codes.length > 0 && mode) {
        console.log('Codes', codes);
        const barcode = codes[0].value;
        if (barcode) {
          handleBarcodeScan(barcode);
        }
      }
    },
  });

  const handleBarcodeScan = (barcode: string) => {
    console.log('Scanned barcode:', barcode);
    Vibration.vibrate(50); // Haptic feedback

    setScannedItems(prev => {
      const existing = prev.find(item => item.barcode === barcode);
      if (existing) {
        return prev.map(item =>
          item.barcode === barcode ? {...item, count: item.count + 1} : item,
        );
      }
      // TODO: Fetch supply name from database
      return [...prev, {barcode, name: `Supply ${barcode}`, count: 1}];
    });
  };

  const startScanning = (scanMode: ScanMode) => {
    setMode(scanMode);
    setScannedItems([]);
    setIsActive(true);
  };

  const handleConfirm = () => {
    // TODO: Save to database
    Alert.alert(
      'Success',
      `${mode === 'add' ? 'Added' : 'Used'} ${scannedItems.reduce(
        (sum, item) => sum + item.count,
        0,
      )} items`,
    );
    setScannedItems([]);
    setIsActive(false);
    setMode(null);
  };

  const handleClear = () => {
    setScannedItems([]);
  };

  const handleCancel = () => {
    setScannedItems([]);
    setIsActive(false);
    setMode(null);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan barcodes
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No camera device found</Text>
      </View>
    );
  }

  if (!isActive) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Scan Medical Supplies</Text>
        <Text style={styles.description}>
          Choose an action to start scanning barcodes
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.modeButton, styles.addButton]}
            onPress={() => startScanning('add')}
            accessible={true}
            accessibilityLabel="Add stock - scan barcodes to add supplies to inventory"
            accessibilityRole="button">
            <Text style={styles.modeButtonText}>+ Add Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, styles.useButton]}
            onPress={() => startScanning('use')}
            accessible={true}
            accessibilityLabel="Use supply - scan barcodes to remove supplies from inventory"
            accessibilityRole="button">
            <Text style={styles.modeButtonText}>- Use Supply</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {mode === 'add' ? 'Adding Stock' : 'Using Supply'}
          </Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            accessible={true}
            accessibilityLabel="Cancel scanning"
            accessibilityRole="button">
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanInstruction}>
            Point camera at barcode to scan
          </Text>
        </View>
      </View>

      <ScanConfirmation
        items={scannedItems}
        mode={mode!}
        onConfirm={handleConfirm}
        onClear={handleClear}
        onEdit={(barcode, count) => {
          setScannedItems(prev =>
            prev.map(item =>
              item.barcode === barcode ? {...item, count} : item,
            ),
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.large,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  modeButton: {
    height: touchTarget.large,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.success,
  },
  useButton: {
    backgroundColor: colors.danger,
  },
  modeButtonText: {
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  permissionText: {
    fontSize: fontSize.large,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  headerText: {
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  cancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelButtonText: {
    fontSize: fontSize.large,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: colors.textOnPrimary,
    borderRadius: 12,
  },
  scanInstruction: {
    fontSize: fontSize.large,
    color: colors.textOnPrimary,
    textAlign: 'center',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
});
