/**
 * R2 Settings Screen - Configure Cloudflare R2 image storage
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getR2Config, setR2Config, testR2Connection } from '../../services/r2Upload';

export default function R2SettingsScreen() {
  const { theme } = useTheme();
  const [config, setConfig] = useState({
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    publicUrl: '',
    enabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await getR2Config();
      if (savedConfig) {
        setConfig(savedConfig);
      }
    } catch (error) {
      console.error('Failed to load R2 config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (config.enabled && (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName || !config.publicUrl)) {
      Alert.alert('Validation Error', 'Please fill in all required fields when R2 is enabled.');
      return;
    }

    setIsSaving(true);
    try {
      await setR2Config(config);
      Alert.alert('Success', 'R2 configuration saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.enabled) {
      Alert.alert('Info', 'Please enable R2 first.');
      return;
    }

    if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
      Alert.alert('Validation Error', 'Please fill in all required fields before testing.');
      return;
    }

    setIsTesting(true);
    try {
      // Save config first
      await setR2Config(config);
      const result = await testR2Connection();
      
      if (result.success) {
        Alert.alert('Success', 'Connection test successful! ✅');
      } else {
        Alert.alert('Connection Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Connection test failed. Please check your configuration.');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Configure Cloudflare R2 to store images uploaded in comments and issues. Images will be stored in the cloud instead of being embedded.
          </Text>
        </View>

        {/* Enable/Disable Toggle */}
        <View style={[styles.section, styles.row, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Enable R2 Upload</Text>
            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
              Upload images to Cloudflare R2
            </Text>
          </View>
          <Switch
            value={config.enabled}
            onValueChange={(value) => setConfig({ ...config, enabled: value })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        {/* Configuration Fields */}
        <View style={[styles.section, { opacity: config.enabled ? 1 : 0.5 }]}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Account ID *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.backgroundSecondary, 
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={config.accountId}
              onChangeText={(text) => setConfig({ ...config, accountId: text })}
              placeholder="Your Cloudflare account ID"
              placeholderTextColor={theme.colors.textTertiary}
              editable={config.enabled}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Access Key ID *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.backgroundSecondary, 
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={config.accessKeyId}
              onChangeText={(text) => setConfig({ ...config, accessKeyId: text })}
              placeholder="R2 API access key ID"
              placeholderTextColor={theme.colors.textTertiary}
              editable={config.enabled}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Secret Access Key *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.backgroundSecondary, 
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={config.secretAccessKey}
              onChangeText={(text) => setConfig({ ...config, secretAccessKey: text })}
              placeholder="R2 API secret access key"
              placeholderTextColor={theme.colors.textTertiary}
              editable={config.enabled}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Bucket Name *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.backgroundSecondary, 
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={config.bucketName}
              onChangeText={(text) => setConfig({ ...config, bucketName: text })}
              placeholder="Your R2 bucket name"
              placeholderTextColor={theme.colors.textTertiary}
              editable={config.enabled}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Public URL *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.backgroundSecondary, 
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={config.publicUrl}
              onChangeText={(text) => setConfig({ ...config, publicUrl: text })}
              placeholder="https://your-bucket.r2.dev"
              placeholderTextColor={theme.colors.textTertiary}
              editable={config.enabled}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={[styles.fieldHint, { color: theme.colors.textTertiary }]}>
              Custom domain or R2.dev public URL
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.testButton, { 
              borderColor: theme.colors.primary,
              opacity: config.enabled ? 1 : 0.5
            }]}
            onPress={handleTestConnection}
            disabled={!config.enabled || isTesting}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Test Connection</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Configuration</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={[styles.help, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
          <Text style={[styles.helpTitle, { color: theme.colors.text }]}>Setup Guide:</Text>
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            1. Login to Cloudflare Dashboard{'\n'}
            2. Navigate to R2 Object Storage{'\n'}
            3. Create a new bucket{'\n'}
            4. Generate API credentials{'\n'}
            5. Enable public access on your bucket{'\n'}
            6. Enter configuration above and test connection
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  labelContainer: {
    flex: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    fontSize: 15,
  },
  fieldHint: {
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  testButton: {
    borderWidth: 1,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  help: {
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
