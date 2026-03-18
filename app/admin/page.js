'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { auth, firestoreGetAll, isAdmin } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminPropiedades from '@/components/admin/AdminPropiedades';
import AdminCalendario from '@/components/admin/AdminCalendario';
import AdminPrecios from '@/components/admin/AdminPrecios';
import AdminResenas from '@/components/admin/AdminResenas';
import AdminTareas from '@/components/admin/AdminTareas';
import AdminTickets from '@/components/admin/AdminTickets';
import AdminUsuarios from '@/components/admin/AdminUsuarios';
import styles from './admin.module.css';

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [seccion, setSeccion] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [propiedades, setPropiedades] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const isFetchingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const cargarTodo = useCallback(async (isManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManual) {
      setIsRefreshing(true);
    } else {
      setDataLoading(true);
    }
    setErrorMsg(null);

    try {
      const [props, revs, ticks, tars, usrs] = await Promise.all([
        firestoreGetAll('propiedades'),
        firestoreGetAll('reservas'),
        firestoreGetAll('tickets-soporte'),
        firestoreGetAll('tareas'),
        firestoreGetAll('users'),
      ]);
      setPropiedades(props);
      setReservas(revs);
      setTickets(ticks);
      setTareas(tars);
      setUsuarios(usrs);
    } catch (error) {
      console.error('Error cargando datos admin:', error);
      if (error.message?.includes('401') || error.message?.includes('403')) {
        setErrorMsg('Tu sesión expiró. Redirigiendo al login...');
        setTimeout(() => router.push('/login'), 2500);
      } else {
        setErrorMsg('No se pudieron cargar los datos. Verificá tu conexión e intentá de nuevo.');
        setTimeout(() => setErrorMsg(null), 5000);
      }
    } finally {
      setDataLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      if (!isAdmin(currentUser.email)) {
        alert('Sin permisos de administrador.');
        router.push('/');
        return;
      }
      try {
        await currentUser.getIdToken(true);
      } catch {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
      cargarTodo(false);
    });
    return () => unsubscribe();
  }, [router, cargarTodo]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) await currentUser.getIdToken(true);
      } catch {
        router.push('/login');
      }
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [router]);

  const menuItems = [
    { key: 'dashboard',   icon: '📊', label: 'Dashboard' },
    { key: 'propiedades', icon: '🏠', label: 'Propiedades', count: propiedades.length },
    { key: 'calendario',  icon: '📅', label: 'Calendario' },
    { key: 'precios',     icon: '💰', label: 'Precios' },
    { key: 'resenas',     icon: '⭐', label: 'Reseñas' },
    { key: 'tareas',      icon: '🧹', label: 'Tareas', count: tareas.filter(t => t.estado !== 'completada').length },
    { key: 'tickets',     icon: '💬', label: 'Soporte', count: tickets.filter(t => t.estado === 'pendiente').length },
    { key: 'usuarios',    icon: '👥', label: 'Usuarios', count: usuarios.length },
  ];

  const handleSeccion = (key) => {
    setSeccion(key);
    setSidebarOpen(false);
  };

  const handleRefresh = () => {
    if (!isRefreshing) cargarTodo(true);
  };

  const seccionActual = menuItems.find(m => m.key === seccion);

  if (authLoading) {
    return (
      <div className={styles.adminLoading}>
        <div className="loading-spinner"></div>
        Verificando acceso...
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>

      {/* Toast de error */}
      {errorMsg && (
        <div className={styles.toastError}>
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className={styles.toastClose}>✕</button>
        </div>
      )}

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <button onClick={() => router.push('/')} className={styles.sidebarLogo}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect x="10" y="20" width="20" height="16" fill="white"/>
              <path d="M20 8 L32 20 L8 20 Z" fill="white"/>
              <rect x="16" y="24" width="8" height="8" fill="#1e3a5f"/>
            </svg>
            <span>alquilala</span>
          </button>

          {/* Badge + botón X agrupados */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={styles.sidebarBadge}>Admin</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className={styles.sidebarCloseBtn}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>
        </div>

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

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUser}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className={styles.sidebarAvatar} />
            ) : (
              <div className={styles.sidebarAvatarInit}>
                {user?.displayName?.charAt(0) || 'A'}
              </div>
            )}
            <div className={styles.sidebarUserInfo}>
              <p className={styles.sidebarUserName}>{user?.displayName || 'Admin'}</p>
              <p className={styles.sidebarUserEmail}>{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.mainContent}>

        {/* Top bar */}
        <div className={styles.topBar}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={styles.menuToggle}
            aria-label="Abrir menú"
          >
            <span></span><span></span><span></span>
          </button>

          <h1 className={styles.topBarTitle}>
            <span className={styles.topBarTitleText}>
              {seccionActual?.icon} {seccionActual?.label}
            </span>
          </h1>

          <button
            onClick={handleRefresh}
            className={`${styles.refreshBtn} ${isRefreshing ? styles.refreshBtnSpinning : ''}`}
            aria-label="Actualizar datos"
            disabled={isRefreshing}
            title={isRefreshing ? 'Actualizando...' : 'Actualizar datos'}
          >
            🔄
          </button>
        </div>

        {/* Contenido */}
        <div className={styles.contentArea}>
          {dataLoading ? (
            <div className={styles.skeletonWrapper}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : (
            <>
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
                  onRefresh={() => cargarTodo(true)}
                />
              )}
              {seccion === 'calendario' && (
                <AdminCalendario
                  propiedades={propiedades}
                  reservas={reservas}
                  onRefresh={() => cargarTodo(true)}
                />
              )}
              {seccion === 'precios' && (
                <AdminPrecios
                  propiedades={propiedades}
                  onRefresh={() => cargarTodo(true)}
                />
              )}
              {seccion === 'resenas' && (
                <AdminResenas propiedades={propiedades} />
              )}
              {seccion === 'tareas' && (
                <AdminTareas
                  tareas={tareas}
                  propiedades={propiedades}
                  onRefresh={() => cargarTodo(true)}
                />
              )}
              {seccion === 'tickets' && (
                <AdminTickets
                  tickets={tickets}
                  onRefresh={() => cargarTodo(true)}
                />
              )}
              {seccion === 'usuarios' && (
                <AdminUsuarios
                  usuarios={usuarios}
                  propiedades={propiedades}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}