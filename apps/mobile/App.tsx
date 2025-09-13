import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  const showComingSoon = (feature: string) => {
    Alert.alert('即将推出', `${feature} 功能正在开发中，敬请期待！`);
  };

  const HomeScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>GitIssueBlog</Text>
        <Text style={styles.appSubtitle}>
          使用 GitHub Issues 管理你的博客
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快速开始</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentScreen('editor')}>
          <Text style={styles.primaryButtonText}>📝 创建笔记</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentScreen('editor')}>
          <Text style={styles.secondaryButtonText}>📄 创建博客</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>功能菜单</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => showComingSoon('文章列表')}
        >
          <Text style={styles.menuItemText}>📚 文章列表</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => showComingSoon('标签管理')}
        >
          <Text style={styles.menuItemText}>🏷️ 标签管理</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => showComingSoon('GitHub 连接')}
        >
          <Text style={styles.menuItemText}>🐙 GitHub 连接</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentScreen('settings')}>
          <Text style={styles.menuItemText}>⚙️ 设置</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          基于 all-in-github 项目构建
        </Text>
      </View>
    </ScrollView>
  );

  const EditorScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>编辑器</Text>
        <TouchableOpacity style={styles.saveButton} onPress={() => showComingSoon('保存功能')}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.editorContent}>
        <Text style={styles.editorPlaceholder}>
          编辑器功能正在开发中...
        </Text>
        <Text style={styles.editorSubtext}>
          这里将集成 Tiptap 富文本编辑器
        </Text>
      </View>
    </View>
  );

  const SettingsScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.settingsContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账户</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => showComingSoon('GitHub 连接')}
          >
            <Text style={styles.settingItemText}>🐙 GitHub 连接</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>外观</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => showComingSoon('主题设置')}
          >
            <Text style={styles.settingItemText}>🎨 主题</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => showComingSoon('应用信息')}
          >
            <Text style={styles.settingItemText}>ℹ️ 应用信息</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.appContainer}>
      <StatusBar style="auto" />
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'editor' && <EditorScreen />}
      {currentScreen === 'settings' && <SettingsScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 40,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  settingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingItemText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  editorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  editorPlaceholder: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 10,
  },
  editorSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  settingsContent: {
    flex: 1,
    paddingVertical: 10,
  },
});
