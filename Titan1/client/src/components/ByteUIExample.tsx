import React, { useState } from 'react';
import { 
  Button, Card, Space, Typography, Form, Input, 
  Select, Switch, Checkbox,
  Tag, Avatar, Badge, Tabs, Grid, 
  toast, notification
} from './ByteUI';

const { Title, Paragraph, Text } = Typography;
const { Row, Col } = Grid;
const { Option } = Select;
const { TabPane } = Tabs;

const ByteUIExample: React.FC = () => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    toast.success('Form submitted successfully!');
  };

  const handleNotification = () => {
    notification.info('Info Message', 'This is a sample notification from ByteUI.');
  };

  return (
    <div className="byte-ui-example p-6">
      <Card className="mb-6">
        <Title>ByteUI Components</Title>
        <Paragraph>
          This is a showcase of ByteUI components using Arco Design.
        </Paragraph>
        
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          <TabPane key="1" title="Basic Components">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card title="Buttons">
                <Space>
                  <Button type="primary">Primary</Button>
                  <Button>Default</Button>
                  <Button type="secondary">Secondary</Button>
                  <Button type="outline">Outline</Button>
                  <Button type="text">Text</Button>
                  <Button type="primary" status="danger">Danger</Button>
                </Space>
              </Card>
              
              <Card title="Typography">
                <Title heading={2}>Title Heading 2</Title>
                <Title heading={4}>Title Heading 4</Title>
                <Paragraph>
                  This is a paragraph with <Text style={{ fontWeight: 'bold' }}>bold text</Text> and{' '}
                  <Text style={{ fontStyle: 'italic' }}>italic text</Text> and{' '}
                  <Text style={{ textDecoration: 'underline' }}>underlined text</Text> and{' '}
                  <Text style={{ textDecoration: 'line-through' }}>deleted text</Text>.
                </Paragraph>
              </Card>
              
              <Card title="Tags & Badges">
                <Space>
                  <Tag color="blue">Tag Blue</Tag>
                  <Tag color="green">Tag Green</Tag>
                  <Tag color="orange">Tag Orange</Tag>
                  <Tag color="red">Tag Red</Tag>
                  <Badge count={5}>
                    <Avatar shape="square">A</Avatar>
                  </Badge>
                  <Badge dot>
                    <Avatar shape="square">B</Avatar>
                  </Badge>
                </Space>
              </Card>
            </Space>
          </TabPane>
          
          <TabPane key="2" title="Form Components">
            <Form form={form} onSubmit={handleSubmit} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Form.Item label="Username" field="username" rules={[{ required: true }]}>
                <Input placeholder="Enter your username" />
              </Form.Item>
              
              <Form.Item label="Email" field="email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="Enter your email" />
              </Form.Item>
              
              <Form.Item label="Role" field="role" rules={[{ required: true }]}>
                <Select placeholder="Select a role">
                  <Option value="admin">Admin</Option>
                  <Option value="user">User</Option>
                  <Option value="guest">Guest</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Active" field="active">
                <Switch />
              </Form.Item>
              
              <Form.Item label="Notifications" field="notifications">
                <Checkbox.Group>
                  <Checkbox value="email">Email</Checkbox>
                  <Checkbox value="sms">SMS</Checkbox>
                  <Checkbox value="push">Push</Checkbox>
                </Checkbox.Group>
              </Form.Item>
              
              <Form.Item wrapperCol={{ offset: 8 }}>
                <Space>
                  <Button type="primary" htmlType="submit">Submit</Button>
                  <Button onClick={() => form.resetFields()}>Reset</Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane key="3" title="Notifications">
            <Space direction="vertical" size="large">
              <Card title="Toast Messages">
                <Row gutter={16}>
                  <Col span={6}>
                    <Button 
                      type="primary" 
                      onClick={() => toast.success('Success message')}
                      long
                    >
                      Success Toast
                    </Button>
                  </Col>
                  <Col span={6}>
                    <Button 
                      type="primary" 
                      status="danger" 
                      onClick={() => toast.error('Error message')}
                      long
                    >
                      Error Toast
                    </Button>
                  </Col>
                  <Col span={6}>
                    <Button 
                      type="primary" 
                      status="warning" 
                      onClick={() => toast.warning('Warning message')}
                      long
                    >
                      Warning Toast
                    </Button>
                  </Col>
                  <Col span={6}>
                    <Button 
                      type="primary" 
                      status="success" 
                      onClick={() => toast.info('Info message')}
                      long
                    >
                      Info Toast
                    </Button>
                  </Col>
                </Row>
              </Card>
              
              <Card title="Notifications">
                <Button type="primary" onClick={handleNotification}>
                  Show Notification
                </Button>
              </Card>
            </Space>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ByteUIExample;