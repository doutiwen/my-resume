<route>
  {
    alias: '/',
  }
</route>

<template>
  <MenuLayout>
    <div class="resume-container">
      <!-- 头部信息 -->
      <header class="resume-header">
        <div class="header-content">
          <div class="profile-section">
            <img :src="personalInfo.avatar" :alt="personalInfo.name" class="avatar" />
            <div class="info">
              <h1 class="name">{{ personalInfo.name }}</h1>
              <p class="title">{{ personalInfo.title }}</p>
              <p class="summary">{{ personalInfo.summary }}</p>
            </div>
          </div>
          <div class="contact-section">
            <div
              v-for="(contact, index) in personalInfo.contacts"
              :key="index"
              class="contact-item"
            >
              <i :class="contact.icon"></i>
              <span>{{ contact.value }}</span>
            </div>
            <div class="social-links">
              <a
                v-for="(social, index) in personalInfo.socialLinks"
                :key="index"
                :href="social.url"
                target="_blank"
                class="social-link"
              >
                <i :class="social.icon"></i>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div class="resume-body">
        <!-- 左侧栏 -->
        <aside class="resume-sidebar">
          <!-- 关于我 -->
          <section class="section about-section">
            <h2 class="section-title">
              <i class="fas fa-user"></i>
              关于我
            </h2>
            <p class="about-text">{{ aboutInfo.description }}</p>
            <div class="tags">
              <span v-for="(tag, index) in aboutInfo.tags" :key="index" class="tag">{{ tag }}</span>
            </div>
          </section>

          <!-- 技能 -->
          <section class="section skills-section">
            <h2 class="section-title">
              <i class="fas fa-code"></i>
              专业技能
            </h2>
            <div class="skill-list">
              <div v-for="(skill, index) in skillsInfo.mainSkills" :key="index" class="skill-item">
                <div class="skill-header">
                  <span class="skill-name">{{ skill.name }}</span>
                  <span class="skill-level">{{ skill.level }}%</span>
                </div>
                <el-progress
                  :percentage="skill.level"
                  :color="'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'"
                  :stroke-width="8"
                  :show-text="false"
                />
              </div>
            </div>
            <div class="skill-tags">
              <span v-for="(tag, index) in skillsInfo.skillTags" :key="index" class="skill-tag">
                {{ tag }}
              </span>
            </div>
          </section>
        </aside>

        <!-- 右侧主内容 -->
        <main class="resume-main">
          <!-- 工作经历 -->
          <section class="section experience-section">
            <h2 class="section-title">
              <i class="fas fa-briefcase"></i>
              工作经历
            </h2>
            <el-timeline>
              <el-timeline-item
                v-for="(experience, index) in experienceInfo"
                :key="index"
                :timestamp="experience.period"
                placement="top"
              >
                <el-card class="resume-card">
                  <template #header>
                    <div class="card-header">
                      <h3 class="job-title">{{ experience.title }}</h3>
                      <span class="company">{{ experience.company }}</span>
                    </div>
                  </template>
                  <p class="job-desc">{{ experience.description }}</p>
                  <div class="achievements">
                    <h4>主要成就：</h4>
                    <ul>
                      <li v-for="(achievement, idx) in experience.achievements" :key="idx">
                        {{ achievement }}
                      </li>
                    </ul>
                  </div>
                  <div class="tech-stack">
                    <span v-for="(tech, idx) in experience.techStack" :key="idx" class="tech-tag">
                      {{ tech }}
                    </span>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </section>

          <!-- 教育背景 -->
          <section class="section education-section">
            <h2 class="section-title">
              <i class="fas fa-graduation-cap"></i>
              教育背景
            </h2>
            <el-timeline>
              <el-timeline-item
                v-for="(education, index) in educationInfo"
                :key="index"
                :timestamp="education.period"
                placement="top"
              >
                <el-card class="resume-card">
                  <template #header>
                    <div class="card-header">
                      <h3 class="school-name">{{ education.school }}</h3>
                      <span class="major">{{ education.major }}</span>
                    </div>
                  </template>
                  <p class="edu-desc">{{ education.description }}</p>
                  <div class="achievements-tags">
                    <span
                      v-for="(tag, idx) in education.achievements"
                      :key="idx"
                      class="achievement-tag"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </section>

          <!-- 项目经历 -->
          <section class="section projects-section">
            <h2 class="section-title">
              <i class="fas fa-project-diagram"></i>
              项目经历
            </h2>
            <div class="projects-grid">
              <div v-for="(project, index) in projectInfo" :key="index" class="project-card">
                <div class="project-header">
                  <h3 class="project-title">{{ project.title }}</h3>
                  <span class="project-date">{{ project.date }}</span>
                </div>
                <p class="project-desc">{{ project.description }}</p>
                <div class="project-tech">
                  <span v-for="(tech, idx) in project.techStack" :key="idx" class="tech-tag">
                    {{ tech }}
                  </span>
                </div>
                <div class="project-links">
                  <a
                    v-for="(link, idx) in project.links"
                    :key="idx"
                    :href="link.url"
                    class="project-link"
                  >
                    <i :class="link.icon"></i>
                    {{ link.text }}
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  </MenuLayout>
</template>

<script setup name="home">
  import { ref } from 'vue';
  import MenuLayout from '@/layouts/menuLayout.vue';
  import avatarPic from './common/img/avatar.png';

  // 个人基本信息
  const personalInfo = ref({
    name: '张三',
    title: '高级前端工程师',
    summary: '5年+前端开发经验，专注于Vue/React生态，热爱技术分享与开源贡献',
    avatar: avatarPic,
    contacts: [
      { icon: 'fas fa-map-marker-alt', value: '北京市朝阳区' },
      { icon: 'fas fa-phone', value: '138-0000-0000' },
      { icon: 'fas fa-envelope', value: 'zhangsan@email.com' },
      { icon: 'fas fa-calendar', value: '28岁' },
    ],
    socialLinks: [
      { icon: 'fab fa-github', url: 'https://github.com' },
      { icon: 'fab fa-linkedin', url: 'https://linkedin.com' },
    ],
  });

  // 关于我信息
  const aboutInfo = ref({
    description:
      '5年前端开发经验，专注于Vue3、React等现代前端技术栈。热爱技术，追求极致的用户体验。具备良好的团队协作能力和项目管理经验。',
    tags: ['Vue3', 'React', 'TypeScript', 'Node.js', 'Webpack'],
  });

  // 技能信息
  const skillsInfo = ref({
    mainSkills: [
      { name: 'Vue.js', level: 90 },
      { name: 'React', level: 85 },
      { name: 'TypeScript', level: 80 },
      { name: 'Node.js', level: 75 },
      { name: 'Python', level: 70 },
    ],
    skillTags: [
      'JavaScript',
      'HTML5',
      'CSS3',
      'Webpack',
      'Vite',
      'Git',
      'Element Plus',
      'Ant Design',
      'Tailwind CSS',
      'Sass',
      'RESTful API',
      'GraphQL',
      'MongoDB',
      'MySQL',
      'Docker',
    ],
  });

  // 工作经历信息
  const experienceInfo = ref([
    {
      title: '高级前端工程师',
      company: '某知名互联网公司',
      period: '2022.03 - 至今',
      description: '负责公司核心产品的前端架构设计与开发，带领团队完成多个重要项目',
      achievements: [
        '主导前端架构升级，将页面加载速度提升40%',
        '建立组件库规范，提升团队开发效率30%',
        '推动微前端架构落地，支持多团队并行开发',
      ],
      techStack: ['Vue3', 'TypeScript', 'Vite', 'Element Plus'],
    },
    {
      title: '前端开发工程师',
      company: '某科技创业公司',
      period: '2020.06 - 2022.02',
      description: '参与公司SaaS平台的前端开发，负责多个业务模块的实现',
      achievements: [
        '独立完成用户权限管理系统开发',
        '优化数据可视化大屏性能，支持万级数据实时渲染',
        '封装通用图表组件，被多个项目复用',
      ],
      techStack: ['Vue2', 'ECharts', 'Webpack', 'Sass'],
    },
    {
      title: '初级前端工程师',
      company: '某软件外包公司',
      period: '2019.07 - 2020.05',
      description: '参与多个企业官网和管理后台的开发工作',
      achievements: [
        '完成10+企业官网响应式开发',
        '参与电商后台管理系统开发',
        '编写技术文档，帮助新人快速上手',
      ],
      techStack: ['HTML5', 'CSS3', 'JavaScript', 'jQuery'],
    },
  ]);

  // 教育背景信息
  const educationInfo = ref([
    {
      school: '北京大学',
      major: '计算机科学与技术 · 硕士',
      period: '2018 - 2021',
      description: '专注于人工智能与机器学习方向研究',
      achievements: ['优秀毕业生', '国家奖学金', 'ACM竞赛金牌'],
    },
    {
      school: '清华大学',
      major: '软件工程 · 本科',
      period: '2014 - 2018',
      description: '主修软件开发与系统设计',
      achievements: ['三好学生', '一等奖学金'],
    },
  ]);

  // 项目经历信息
  const projectInfo = ref([
    {
      title: '企业级管理系统',
      date: '2024.01 - 2024.06',
      description:
        '基于 Vue3 + Element Plus 开发的企业级后台管理系统，支持权限管理、数据可视化、表单设计器等功能模块。',
      techStack: ['Vue3', 'Element Plus', 'Pinia', 'ECharts'],
      links: [
        { icon: 'fas fa-external-link-alt', text: '在线演示', url: '#' },
        { icon: 'fab fa-github', text: '源码', url: '#' },
      ],
    },
    {
      title: '电商平台小程序',
      date: '2023.06 - 2023.12',
      description: '微信小程序电商平台，包含商品展示、购物车、订单管理、支付集成等核心功能。',
      techStack: ['UniApp', 'Vue3', 'Pinia', '微信支付'],
      links: [{ icon: 'fab fa-github', text: '源码', url: '#' }],
    },
    {
      title: '数据可视化大屏',
      date: '2023.01 - 2023.05',
      description: '实时数据监控大屏，支持多数据源接入、动态图表渲染、响应式布局适配。',
      techStack: ['Vue3', 'D3.js', 'WebSocket', 'Node.js'],
      links: [{ icon: 'fas fa-external-link-alt', text: '在线演示', url: '#' }],
    },
  ]);
</script>

<style lang="scss" scoped>
  /* 简历容器 */
  .resume-container {
    max-width: 1200px;
    margin: 0 auto;
    background: #fff;
    min-height: 100vh;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);

    /* 头部样式 */
    .resume-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 40px;

        .profile-section {
          display: flex;
          align-items: center;
          gap: 24px;

          .avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid rgba(255, 255, 255, 0.3);
            object-fit: contain‌;
          }

          .info {
            .name {
              font-size: 32px;
              font-weight: 700;
              margin: 0 0 8px 0;
            }

            .title {
              font-size: 18px;
              opacity: 0.9;
              margin: 0 0 12px 0;
            }

            .summary {
              font-size: 14px;
              opacity: 0.8;
              line-height: 1.5;
              max-width: 400px;
            }
          }
        }

        .contact-section {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;

            i {
              width: 16px;
            }
          }

          .social-links {
            display: flex;
            gap: 12px;
            margin-top: 8px;

            .social-link {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              text-decoration: none;
              transition: all 0.3s ease;

              &:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
              }
            }
          }
        }
      }
    }

    /* 主体布局 */
    .resume-body {
      display: flex;
      min-height: calc(100vh - 200px);

      /* 侧边栏 */
      .resume-sidebar {
        width: 320px;
        background: #f8f9fa;
        padding: 30px;
        border-right: 1px solid #e8e8e8;

        /* 关于我 */
        .about-section {
          .about-text {
            font-size: 14px;
            color: #666;
            line-height: 1.8;
            margin-bottom: 16px;
          }

          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .tag {
              display: inline-block;
              padding: 4px 12px;
              background: #e3f2fd;
              color: #1976d2;
              font-size: 12px;
              border-radius: 4px;
            }
          }
        }

        /* 技能 */
        .skills-section {
          .skill-list {
            margin-bottom: 20px;

            .skill-item {
              margin-bottom: 16px;

              .skill-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;

                .skill-name {
                  font-size: 13px;
                  color: #555;
                }

                .skill-level {
                  font-size: 12px;
                  color: #667eea;
                  font-weight: 500;
                }
              }
            }
          }

          .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .skill-tag {
              display: inline-block;
              padding: 4px 10px;
              background: #fff;
              border: 1px solid #ddd;
              color: #666;
              font-size: 12px;
              border-radius: 4px;
              transition: all 0.2s ease;

              &:hover {
                border-color: #667eea;
                color: #667eea;
              }
            }
          }
        }

        /* 联系方式侧边栏 */
        .contact-section-sidebar {
          .contact-list {
            display: flex;
            flex-direction: column;
            gap: 12px;

            .contact-row {
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 14px;
              color: #666;

              i {
                width: 20px;
                color: #667eea;
              }
            }
          }
        }
      }

      /* 主内容区 */
      .resume-main {
        flex: 1;
        padding: 30px;

        /* 工作经历和教育背景卡片动画 */
        .resume-card {
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          }
        }

        /* 工作经历 */
        .experience-section {
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
          }

          .job-title,
          .school-name {
            font-size: 16px;
            font-weight: 600;
            color: #333;
          }

          .company,
          .major {
            font-size: 14px;
            color: #667eea;
            font-weight: 500;
          }

          .job-desc,
          .edu-desc {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 12px;
          }

          .achievements {
            h4 {
              font-size: 13px;
              font-weight: 600;
              color: #333;
              margin-bottom: 8px;
            }

            ul {
              padding-left: 16px;
              margin: 0;

              li {
                font-size: 13px;
                color: #666;
                line-height: 1.8;
              }
            }
          }

          .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;

            .tech-tag {
              display: inline-block;
              padding: 3px 10px;
              background: #f0f0f0;
              color: #666;
              font-size: 12px;
              border-radius: 4px;
            }
          }

          .achievements-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .achievement-tag {
              display: inline-block;
              padding: 3px 10px;
              background: #fff3e0;
              color: #e65100;
              font-size: 12px;
              border-radius: 4px;
            }
          }
        }

        /* 项目经历 */
        .projects-section {
          .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;

            .project-card {
              background: #fff;
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              transition: all 0.3s ease;

              &:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
              }

              .project-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;

                .project-title {
                  font-size: 16px;
                  font-weight: 600;
                  color: #333;
                }

                .project-date {
                  font-size: 12px;
                  color: #999;
                }
              }

              .project-desc {
                font-size: 14px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 16px;
              }

              .project-tech {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 16px;

                .tech-tag {
                  display: inline-block;
                  padding: 3px 10px;
                  background: #f0f0f0;
                  color: #666;
                  font-size: 12px;
                  border-radius: 4px;
                }
              }

              .project-links {
                display: flex;
                gap: 16px;

                .project-link {
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  color: #667eea;
                  font-size: 13px;
                  text-decoration: none;
                  transition: color 0.2s;

                  &:hover {
                    color: #764ba2;
                  }
                }
              }
            }
          }
        }

        /* 联系表单 */
        .contact-form-section {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 12px;

          .contact-form {
            max-width: 100%;

            .form-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }

            .form-group {
              margin-bottom: 20px;

              label {
                display: block;
                margin-bottom: 8px;
                font-size: 14px;
                font-weight: 500;
                color: #333;
              }

              input,
              textarea {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.2s ease;
                font-family: inherit;

                &:focus {
                  outline: none;
                  border-color: #667eea;
                  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
              }

              textarea {
                resize: vertical;
                min-height: 100px;
              }
            }

            .form-actions {
              display: flex;
              gap: 12px;

              .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
              }

              .btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;

                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
              }

              .btn-secondary {
                background: #fff;
                color: #666;
                border: 1px solid #ddd;

                &:hover {
                  background: #f5f5f5;
                }
              }
            }
          }
        }
      }
    }
  }

  /* 通用区块样式 */
  .section {
    margin-bottom: 30px;
    animation: fadeIn 0.5s ease forwards;

    &:nth-child(1) {
      animation-delay: 0.1s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.3s;
    }
    &:nth-child(4) {
      animation-delay: 0.4s;
    }
    &:nth-child(5) {
      animation-delay: 0.5s;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
      display: flex;
      align-items: center;
      gap: 10px;

      i {
        color: #667eea;
      }
    }
  }

  /* 响应式设计 */
  @media (max-width: 992px) {
    .resume-container {
      .resume-body {
        flex-direction: column;

        .resume-sidebar {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid #e8e8e8;
        }
      }

      .resume-header {
        .header-content {
          flex-direction: column;
          text-align: center;

          .profile-section {
            flex-direction: column;

            .info {
              .summary {
                max-width: 100%;
              }
            }
          }

          .contact-section {
            align-items: center;
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    .resume-container {
      .resume-header {
        padding: 24px;

        .header-content {
          .profile-section {
            .info {
              .name {
                font-size: 24px;
              }
            }
          }
        }
      }

      .resume-body {
        .resume-sidebar,
        .resume-main {
          padding: 20px;
        }

        .resume-main {
          .contact-form-section {
            .contact-form {
              .form-row {
                grid-template-columns: 1fr;
              }
            }
          }

          .projects-section {
            .projects-grid {
              grid-template-columns: 1fr;
            }
          }
        }
      }
    }
  }

  /* 动画效果 */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 打印样式 */
  @media print {
    body {
      background: white;
    }

    .resume-container {
      box-shadow: none;

      .resume-main {
        .contact-form-section {
          display: none;
        }

        .projects-section {
          .projects-grid {
            .project-card {
              .project-links {
                display: none;
              }
            }
          }
        }
      }
    }
  }
</style>
