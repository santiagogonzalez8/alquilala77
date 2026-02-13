'use client';

import { useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/adminConfig';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminPropiedades from '@/components/admin/AdminPropiedades';
import AdminCalendario from '@/components/admin/AdminCalendario';
import AdminTareas from '@/components/admin/AdminTareas';
import AdminTickets from '@/components/admin/AdminTickets';
import AdminUsuarios from '@/components/admin/AdminUsuarios';
import styles from './admin.module.css';

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seccion, setSeccion] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Datos compartidos
  const [propiedades, setPropiedades] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) { router.push('/login'); return; }
      if (!isAdmin(currentUser.email)) { alert('Sin permisos'); router.push('/'); return; }
      setUser(currentUser);
      cargarTodo();
    });
    return () => unsubscribe();
  }, [router]);

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    try {
      const [propSnap, resSnap, tickSnap, tarSnap, usrSnap] = await Promise.all([
        getDocs(collection(db, 'propiedades')),
        getDocs(collection(db, 'reservas')),
        getDocs(collection(db, 'tickets-soporte')),
        getDocs(collection(db, 'tareas')),
        getDocs(collection(db, 'users')),
      ]);
      setPropiedades(propSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setReservas(resSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTickets(tickSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTareas(tarSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsuarios(usrSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const menuItems = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'propiedades', icon: '🏠', label: 'Propiedades', count: propiedades.length },
    { key: 'calendario', icon: '📅', label: 'Calendario' },
    { key: 'tareas', icon: '🧹', label: 'Tareas', count: tareas.filter(t => t.estado !== 'completada').length },
    { key: 'tickets', icon: '💬', label: 'Soporte', count: tickets.filter(t => t.estado === 'pendiente').length },
    { key: 'usuarios', icon: '👥', label: 'Usuarios', count: usuarios.length },
  ];

  const handleSeccion = (key) => {
    setSeccion(key);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className={styles.adminLoading}>
        <div className="loading-spinner"></div>
        Cargando panel de admin...
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      {/* ---- SIDEBAR ---- */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo */}
        <div className={styles.sidebarHeader}>
          <button onClick={() => router.push('/')} className={styles.sidebarLogo}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect x="10" y="20" width="20" height="16" fill="white"/>
              <path d="M20 8 L32 20 L8 20 Z" fill="white"/>
              <rect x="16" y="24" width="8" height="8" fill="#1e3a5f"/>
            </svg>
            <span>alquilala</span>
          </button>
          <span className={styles.sidebarBadge}>Admin</span>
        </div>

        {/* Menú */}
        <nav className={styles.sidebarNav}>
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleSeccion(item.key)}
              className={`${styles.sidebarItem} ${seccion === item.key ? styles.sidebarItemActive : ''}`}
            >
              <span className={styles.sidebarIcon}>{item.icon}</span>
              <span className={styles.sidebarLabel}>{item.label}</span>
              {item.count > 0 && (
                <span className={styles.sidebarCount}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUser}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className={styles.sidebarAvatar} />
            ) : (
              <div className={styles.sidebarAvatarInit}>
                {user?.displayName?.charAt(0) || 'A'}
              </div>
            )}
            <div>
              <p className={styles.sidebarUserName}>{user?.displayName || 'Admin'}</p>
              <p className={styles.sidebarUserEmail}>{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ---- MAIN CONTENT ---- */}
      <main className={styles.mainContent}>
        {/* Top bar mobile */}
        <div className={styles.topBar}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={styles.menuToggle}
            aria-label="Abrir menú"
          >
            <span></span><span></span><span></span>
          </button>
          <h1 className={styles.topBarTitle}>
            {menuItems.find(m => m.key === seccion)?.icon}{' '}
            {menuItems.find(m => m.key === seccion)?.label}
          </h1>
          <button onClick={cargarTodo} className={styles.refreshBtn} aria-label="Actualizar">
            🔄
          </button>
        </div>

        {/* Contenido dinámico */}
        <div className={styles.contentArea}>
          {seccion === 'dashboard' && (
            <AdminDashboard
              propiedades={propiedades}
              reservas={reservas}
              tickets={tickets}
              tareas={tareas}
              usuarios={usuarios}
              onNavigate={setSeccion}
            />
          )}
          {seccion === 'propiedades' && (
            <AdminPropiedades
              propiedades={propiedades}
              onRefresh={cargarTodo}
            />
          )}
          {seccion === 'calendario' && (
            <AdminCalendario
              propiedades={propiedades}
              reservas={reservas}
              onRefresh={cargarTodo}
            />
          )}
          {seccion === 'tareas' && (
            <AdminTareas
              tareas={tareas}
              propiedades={propiedades}
              onRefresh={cargarTodo}
            />
          )}
          {seccion === 'tickets' && (
            <AdminTickets
              tickets={tickets}
              onRefresh={cargarTodo}
            />
          )}
          {seccion === 'usuarios' && (
            <AdminUsuarios
              usuarios={usuarios}
              propiedades={propiedades}
            />
          )}
        </div>
      </main>
    </div>
  );
}