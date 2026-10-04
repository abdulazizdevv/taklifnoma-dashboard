import { useCallback, useEffect, useState } from "react";
import {
  CheckCircleOutlined,
  CopyOutlined,
  EditOutlined,
  LogoutOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  ConfigProvider,
  Descriptions,
  Drawer,
  Flex,
  Form,
  Input,
  Layout,
  Menu,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import "./App.css";
import { clearAccessToken, loginWithTelegram, logout, restoreAuthSession, saveAccessToken } from "./lib/api/auth";
import {
  createInvitation,
  getInvitation,
  listInvitations,
  submitInvitation,
  updateInvitation,
} from "./lib/api/invitations";
import { listTemplates } from "./lib/api/templates";
import { TelegramLoginWidget } from "./components/TelegramLoginWidget";
import type {
  AuthSession,
  EventType,
  InvitationDetail,
  InvitationSummary,
  TelegramLoginPayload,
  TemplateOption,
  UpdateInvitationPayload,
} from "./lib/api/types";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const eventTypes: Array<{ value: EventType; label: string }> = [
  { value: "WEDDING", label: "To‘y / Nikoh" },
  { value: "BIRTHDAY", label: "Tug‘ilgan kun" },
  { value: "MORNING_OSH", label: "Nahorgi osh" },
  { value: "SUNNAT", label: "Sunnat to‘y" },
  { value: "ENGAGEMENT", label: "Fotiha" },
  { value: "CORPORATE", label: "Korporativ" },
  { value: "GRADUATION", label: "Bitiruv" },
  { value: "FAMILY_EVENT", label: "Oilaviy marosim" },
  { value: "OTHER", label: "Boshqa" },
];

function Root() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#264337",
          borderRadius: 6,
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      }}
    >
      <AntApp>
        <AdminApp />
      </AntApp>
    </ConfigProvider>
  );
}

function AdminApp() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"create" | "list">("create");

  useEffect(() => {
    let active = true;

    async function restore() {
      try {
        const restored = await restoreAuthSession();
        if (active) setSession(restored);
      } catch {
        clearAccessToken();
        if (active) setSession(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    restore();
    return () => {
      active = false;
    };
  }, []);

  const handleTelegramLogin = useCallback(async (payload: TelegramLoginPayload) => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      const result = await loginWithTelegram(payload);
      saveAccessToken(result.accessToken);
      setSession(result);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Telegram login ishlamadi.");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  async function handleLogout() {
    clearAccessToken();
    setSession(null);
    await logout().catch(() => null);
  }

  if (authLoading) {
    return (
      <main className="auth-screen">
        <Spin size="large" />
        <Text type="secondary">Admin sessiya tekshirilmoqda...</Text>
      </main>
    );
  }

  if (!session) {
    return <TelegramLoginScreen error={authError} onLogin={handleTelegramLogin} />;
  }

  return (
    <Layout className="admin-shell">
      <Sider width={260} theme="light" className="admin-sider">
        <div className="brand">
          <Text type="secondary">taklifnoma</Text>
          <strong>Admin</strong>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeView]}
          onClick={({ key }) => setActiveView(key as "create" | "list")}
          items={[
            { key: "create", icon: <PlusOutlined />, label: "Yangi taklifnoma" },
            { key: "list", icon: <EditOutlined />, label: "Taklifnomalar" },
          ]}
        />
      </Sider>

      <Layout>
        <Header className="admin-header">
          <div>
            <Text type="secondary">Private workspace</Text>
            <Title level={2}>{activeView === "create" ? "Yangi taklifnoma" : "Taklifnomalar"}</Title>
          </div>
          <Card size="small">
            <Space>
              <div>
                <Text strong>
                  {session.user.firstName} {session.user.lastName}
                </Text>
                <br />
                <Text type="secondary">{session.user.username ? `@${session.user.username}` : session.user.role}</Text>
              </div>
              <Button icon={<LogoutOutlined />} onClick={handleLogout} />
            </Space>
          </Card>
        </Header>

        <Content className="admin-content">
          {session.user.role !== "ADMIN" ? (
            <Alert
              type="warning"
              showIcon
              message="ADMIN role kerak"
              description="Backend DB’da bu Telegram user role ADMIN bo‘lishi kerak."
            />
          ) : activeView === "create" ? (
            <CreateInvitationPanel session={session} onCreated={() => setActiveView("list")} />
          ) : (
            <InvitationManager session={session} />
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

function TelegramLoginScreen({
  error,
  onLogin,
}: {
  error: string | null;
  onLogin: (payload: TelegramLoginPayload) => void;
}) {
  return (
    <main className="auth-screen">
      <Card className="login-card">
        <Space direction="vertical" size="middle">
          <Text type="secondary">taklifnoma admin</Text>
          <Title level={2}>Admin panelga kirish</Title>
          <Text type="secondary">
            Telegram orqali kiring. Backend payloadni tekshiradi, ADMIN role bo‘lsa panel ochiladi.
          </Text>
          <TelegramLoginWidget onLogin={onLogin} />
          {error && <Alert type="error" showIcon message={error} />}
        </Space>
      </Card>
    </main>
  );
}

function CreateInvitationPanel({ session, onCreated }: { session: AuthSession; onCreated: () => void }) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{ eventType: EventType; templateId: number }>();
  const [eventType, setEventType] = useState<EventType>("WEDDING");
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listTemplates(eventType, controller.signal)
      .then((items) => {
        setTemplates(items);
        form.setFieldsValue({ templateId: items[0]?.id });
      })
      .catch(() => {
        setTemplates([]);
        form.setFieldsValue({ templateId: undefined });
      })
      .finally(() => setLoadingTemplates(false));

    return () => controller.abort();
  }, [eventType, form]);

  async function handleCreate(values: { eventType: EventType; templateId: number }) {
    setSubmitting(true);
    try {
      const invitation = await createInvitation({
        accessToken: session.accessToken,
        templateId: values.templateId,
        eventType: values.eventType,
      });
      message.success(`Draft yaratildi: #${invitation.id}`);
      onCreated();
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : "Draft yaratilmadi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Flex gap={20} align="start" wrap>
      <Card title="Draft yaratish" className="create-card">
        <Form form={form} layout="vertical" initialValues={{ eventType }} onFinish={handleCreate}>
          <Form.Item label="Marosim turi" name="eventType" rules={[{ required: true }]}>
            <Select
              options={eventTypes}
              onChange={(value: EventType) => {
                setLoadingTemplates(true);
                setEventType(value);
              }}
            />
          </Form.Item>
          <Form.Item label="Template" name="templateId" rules={[{ required: true, message: "Template tanlang" }]}>
            <Select
              loading={loadingTemplates}
              disabled={loadingTemplates || templates.length === 0}
              options={templates.map((template) => ({
                value: template.id,
                label: `#${template.id} · ${template.name}`,
              }))}
            />
          </Form.Item>
          {templates.length === 0 && !loadingTemplates && (
            <Alert type="warning" showIcon message="Template topilmadi. Backendda seed kerak." />
          )}
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined />}
            loading={submitting}
            disabled={templates.length === 0}
          >
            Draft yaratish
          </Button>
        </Form>
      </Card>

      <Card title="Keyingi ishlar" className="help-card">
        <ol className="steps">
          <li>Draft yaratiladi</li>
          <li>Ro‘yxatdan taklifnoma ochiladi</li>
          <li>Ism, sana, manzil va kontaktlar to‘ldiriladi</li>
          <li>Submit/payment/publish flow backend holatiga qarab yuradi</li>
        </ol>
      </Card>
    </Flex>
  );
}

function InvitationManager({ session }: { session: AuthSession }) {
  const { message } = AntApp.useApp();
  const [items, setItems] = useState<InvitationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<InvitationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listInvitations(session.accessToken);
      setItems(result.items);
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : "Taklifnomalar yuklanmadi.");
    } finally {
      setLoading(false);
    }
  }, [message, session.accessToken]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void reload();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [reload]);

  async function openInvitation(id: number) {
    setSelectedId(id);
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      setSelected(await getInvitation(session.accessToken, id));
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : "Taklifnoma ochilmadi.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSave(payload: UpdateInvitationPayload) {
    if (!selectedId) return;
    setSaving(true);
    try {
      const updated = await updateInvitation(session.accessToken, selectedId, payload);
      setSelected(updated);
      message.success("Saqlangan");
      await reload();
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : "Saqlanmadi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await submitInvitation(session.accessToken, selectedId);
      message.success("Paymentga yuborildi");
      await reload();
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : "Submit bo‘lmadi.");
    } finally {
      setSaving(false);
    }
  }

  const columns: ColumnsType<InvitationSummary> = [
    { title: "ID", dataIndex: "id", width: 80 },
    {
      title: "Nomi",
      render: (_, item) => (
        <Space direction="vertical" size={0}>
          <Text strong>{item.title ?? item.template.name}</Text>
          <Text type="secondary">{item.template.code}</Text>
        </Space>
      ),
    },
    { title: "Turi", dataIndex: "eventType", width: 150 },
    {
      title: "Status",
      dataIndex: "status",
      width: 160,
      render: (status: string) => <Tag color={status === "PUBLISHED" ? "green" : "gold"}>{status}</Tag>,
    },
    {
      title: "",
      width: 110,
      render: (_, item) => (
        <Button icon={<EditOutlined />} onClick={() => openInvitation(item.id)}>
          Ochish
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Taklifnomalar ro‘yxati"
        extra={
          <Button icon={<ReloadOutlined />} onClick={reload} loading={loading}>
            Yangilash
          </Button>
        }
      >
        <Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Drawer
        title={selected ? `#${selected.id} tahrirlash` : "Taklifnoma"}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnHidden
      >
        {detailLoading || !selected ? (
          <Spin />
        ) : (
          <InvitationEditor invitation={selected} saving={saving} onSave={handleSave} onSubmit={handleSubmit} />
        )}
      </Drawer>
    </>
  );
}

function InvitationEditor({
  invitation,
  saving,
  onSave,
  onSubmit,
}: {
  invitation: InvitationDetail;
  saving: boolean;
  onSave: (payload: UpdateInvitationPayload) => void;
  onSubmit: () => void;
}) {
  const { message } = AntApp.useApp();
  const publicUrl = `https://taklifnoma.my/invitation/${invitation.id}`;
  const [form] = Form.useForm();

  const initialValues = {
    title: invitation.title ?? "",
    startsAt: invitation.startsAt?.slice(0, 16) ?? "",
    groom: invitation.participants.find((item) => item.role === "groom")?.name ?? "",
    bride: invitation.participants.find((item) => item.role === "bride")?.name ?? "",
    venueName: invitation.venue.name ?? "",
    venueAddress: invitation.venue.address ?? "",
  };

  function handleFinish(values: {
    title: string;
    startsAt?: string;
    groom?: string;
    bride?: string;
    venueName?: string;
    venueAddress?: string;
  }) {
    onSave({
      title: values.title,
      participants: [
        ...(values.groom ? [{ role: "groom", name: values.groom }] : []),
        ...(values.bride ? [{ role: "bride", name: values.bride }] : []),
      ],
      startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : undefined,
      venueName: values.venueName,
      venueAddress: values.venueAddress,
    });
  }

  return (
    <Space direction="vertical" size="large" className="drawer-stack">
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Status">
          <Tag color={invitation.status === "PUBLISHED" ? "green" : "gold"}>{invitation.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Template">{invitation.template.name}</Descriptions.Item>
        <Descriptions.Item label="Public link">
          <Space>
            <Text copyable>{publicUrl}</Text>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                message.success("Link copy qilindi");
              }}
            />
          </Space>
        </Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleFinish}>
        <Form.Item label="Sarlavha" name="title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Sana va vaqt" name="startsAt">
          <Input type="datetime-local" />
        </Form.Item>
        <Flex gap={12}>
          <Form.Item label="Kuyov" name="groom" className="half-field">
            <Input />
          </Form.Item>
          <Form.Item label="Kelin" name="bride" className="half-field">
            <Input />
          </Form.Item>
        </Flex>
        <Form.Item label="Venue nomi" name="venueName">
          <Input />
        </Form.Item>
        <Form.Item label="Venue manzili" name="venueAddress">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Space wrap>
          <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />} loading={saving}>
            Saqlash
          </Button>
          <Button icon={<SendOutlined />} onClick={onSubmit} loading={saving}>
            Paymentga yuborish
          </Button>
        </Space>
      </Form>
    </Space>
  );
}

export default Root;
