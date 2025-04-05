// ByteUI.tsx - Component wrappers for Arco Design / ByteUI
import React from 'react';
import * as Arco from '@arco-design/web-react';
// Import global styles
import '@arco-design/web-react/dist/css/arco.css';

// Theming provider
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Arco.ConfigProvider>
      {children}
    </Arco.ConfigProvider>
  );
};

// Toast and notification utilities
export const toast = {
  success: (content: string, duration = 2000) => {
    Arco.Message.success({ content, duration });
  },
  error: (content: string, duration = 2000) => {
    Arco.Message.error({ content, duration });
  },
  warning: (content: string, duration = 2000) => {
    Arco.Message.warning({ content, duration });
  },
  info: (content: string, duration = 2000) => {
    Arco.Message.info({ content, duration });
  },
  loading: (content: string, duration = 2000) => {
    Arco.Message.loading({ content, duration });
  },
};

export const notification = {
  success: (title: string, content: string) => {
    Arco.Notification.success({ title, content });
  },
  error: (title: string, content: string) => {
    Arco.Notification.error({ title, content });
  },
  warning: (title: string, content: string) => {
    Arco.Notification.warning({ title, content });
  },
  info: (title: string, content: string) => {
    Arco.Notification.info({ title, content });
  },
};

// Alias all Arco Design components to ByteUI
const ByteUI = {
  // Basic components
  Button: Arco.Button,
  Input: Arco.Input,
  TextArea: Arco.Input.TextArea,
  InputSearch: Arco.Input.Search,
  InputPassword: Arco.Input.Password,
  Select: Arco.Select,
  Option: Arco.Select.Option,
  Card: Arco.Card,
  Tabs: Arco.Tabs,
  TabPane: Arco.Tabs.TabPane,
  Modal: Arco.Modal,
  Form: Arco.Form,
  FormItem: Arco.Form.Item,
  useForm: Arco.Form.useForm,
  Dropdown: Arco.Dropdown,
  Menu: Arco.Menu,
  MenuItem: Arco.Menu.Item,
  SubMenu: Arco.Menu.SubMenu,
  MenuItemGroup: Arco.Menu.ItemGroup,
  Avatar: Arco.Avatar,
  Badge: Arco.Badge,
  Tooltip: Arco.Tooltip,
  Switch: Arco.Switch,
  Checkbox: Arco.Checkbox,
  CheckboxGroup: Arco.Checkbox.Group,
  Tag: Arco.Tag,
  Space: Arco.Space,
  Grid: Arco.Grid,
  Row: Arco.Grid.Row,
  Col: Arco.Grid.Col,
  Typography: Arco.Typography,
  Title: Arco.Typography.Title,
  Paragraph: Arco.Typography.Paragraph,
  Text: Arco.Typography.Text,
  Skeleton: Arco.Skeleton,
  Divider: Arco.Divider,
  Spin: Arco.Spin,
  Progress: Arco.Progress,
  // Upload component commented out due to style import issues
  // Upload: Arco.Upload,
  
  // Utility functions
  toast,
  notification,
  ThemeProvider,
};

export default ByteUI;

// Individual named exports for components
export const { 
  Button, Input, TextArea, InputSearch, InputPassword, Select, Option, 
  Card, Tabs, TabPane, Modal, Form, FormItem, useForm, Dropdown, Menu, 
  MenuItem, SubMenu, MenuItemGroup, Avatar, Badge, Tooltip, Switch, 
  Checkbox, CheckboxGroup, Tag, Space, Grid, Row, Col, Typography, 
  Title, Paragraph, Text, Skeleton, Divider, Spin, Progress
  // Upload component removed from exports
} = ByteUI;